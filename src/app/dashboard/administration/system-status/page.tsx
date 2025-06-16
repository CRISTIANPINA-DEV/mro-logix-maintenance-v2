import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Activity, RefreshCw, Database, File, Image, Music, Video, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LiveDatabaseMetrics } from "./LiveDatabaseMetrics";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";

const STORAGE_LIMIT_GB = 100;
const STORAGE_LIMIT_BYTES = STORAGE_LIMIT_GB * 1024 * 1024 * 1024;

interface FileTypeMetrics {
  documents: number;
  images: number;
  audio: number;
  video: number;
  other: number;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileTypeFromMime(fileType: string): 'documents' | 'images' | 'audio' | 'video' | 'other' {
  if (!fileType) return 'other';
  
  if (fileType.startsWith('image/')) return 'images';
  if (fileType.startsWith('video/')) return 'video';
  if (fileType.startsWith('audio/')) return 'audio';
  
  const documentTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument',
    'application/vnd.ms-excel',
    'text/plain',
    'text/csv'
  ];

  if (documentTypes.some(type => fileType.includes(type))) return 'documents';
  
  return 'other';
}

async function getSystemMetrics(companyId: string) {
  const [
    userCount,
    flightRecordCount,
    stockInventoryCount,
    temperatureControlCount,
    incomingInspectionCount,
    technicalQueryCount,
    auditCount,
    notificationCount,
    attachments,
  ] = await Promise.all([
    prisma.user.count({ where: { companyId } }),
    prisma.flightRecord.count({ where: { companyId } }),
    prisma.stockInventory.count({ where: { companyId } }),
    prisma.temperatureControl.count({ where: { companyId } }),
    prisma.incomingInspection.count({ where: { companyId } }),
    prisma.technicalQuery.count({ where: { companyId } }),
    prisma.audit.count({ where: { companyId } }),
    prisma.notification.count({ where: { companyId } }),
    // Get all attachments with their types and sizes
    prisma.$queryRaw<Array<{ fileSize: number; fileType: string }>>`
      SELECT "fileSize", "fileType" FROM (
        SELECT "fileSize", "fileType" FROM "Attachment" WHERE "companyId" = ${companyId}
        UNION ALL
        SELECT "fileSize", "fileType" FROM "StockInventoryAttachment" WHERE "companyId" = ${companyId}
        UNION ALL
        SELECT "fileSize", "fileType" FROM "IncomingInspectionAttachment" WHERE "companyId" = ${companyId}
        UNION ALL
        SELECT "fileSize", "fileType" FROM "AirportIDAttachment" WHERE "companyId" = ${companyId}
        UNION ALL
        SELECT "fileSize", "fileType" FROM "TechnicianTrainingAttachment" WHERE "companyId" = ${companyId}
        UNION ALL
        SELECT "fileSize", "fileType" FROM "TechnicalQueryAttachment" WHERE "companyId" = ${companyId}
        UNION ALL
        SELECT "fileSize", "fileType" FROM "TechnicalQueryResponseAttachment" WHERE "companyId" = ${companyId}
        UNION ALL
        SELECT "fileSize", "fileType" FROM "SMSReportAttachment" WHERE "companyId" = ${companyId}
        UNION ALL
        SELECT "fileSize", "fileType" FROM "SDRReportAttachment" WHERE "companyId" = ${companyId}
        UNION ALL
        SELECT "fileSize", "fileType" FROM "AuditAttachment" WHERE "companyId" = ${companyId}
        UNION ALL
        SELECT "fileSize", "fileType" FROM "AuditFindingAttachment" WHERE "companyId" = ${companyId}
        UNION ALL
        SELECT "fileSize", "fileType" FROM "CorrectiveActionAttachment" WHERE "companyId" = ${companyId}
      ) as all_attachments
    `,
  ]);

  // Calculate total storage and breakdown by file type
  const fileTypeMetrics: FileTypeMetrics = {
    documents: 0,
    images: 0,
    audio: 0,
    video: 0,
    other: 0,
  };

  let totalStorageSize = 0;

  attachments.forEach(attachment => {
    const fileType = getFileTypeFromMime(attachment.fileType);
    fileTypeMetrics[fileType] += Number(attachment.fileSize);
    totalStorageSize += Number(attachment.fileSize);
  });

  return {
    userCount,
    flightRecordCount,
    stockInventoryCount,
    temperatureControlCount,
    incomingInspectionCount,
    technicalQueryCount,
    auditCount,
    notificationCount,
    totalStorageSize,
    fileTypeMetrics,
    storageUsagePercentage: (totalStorageSize / STORAGE_LIMIT_BYTES) * 100,
  };
}

function StorageTypeRow({ icon: Icon, label, size, total }: { icon: any, label: string, size: number, total: number }) {
  const percentage = total > 0 ? (size / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <div className="flex-1 flex items-center justify-between">
        <span className="text-muted-foreground">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-right font-medium">{formatFileSize(size)}</span>
          <span className="text-muted-foreground w-12 text-right">
            {percentage.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}

export default async function SystemStatusPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/dashboard");
  }

  if (session.user.privilege !== "admin") {
    redirect("/dashboard");
  }

  const metrics = await getSystemMetrics(session.user.companyId);

  return (
    <div className="container mx-auto py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/administration">
            <Button 
              variant="outline"
              size="sm"
              className="h-7 px-3 text-xs font-medium rounded-none border-black"
            >
              Back
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-foreground" />
            <div>
              <h1 className="text-2xl font-semibold">System Status</h1>
              <p className="text-sm text-muted-foreground">
                View system metrics and database statistics
              </p>
            </div>
          </div>
        </div>
        <form action="/dashboard/administration/system-status">
          <Button type="submit" variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh Metrics
          </Button>
        </form>
      </div>

      {/* Live Database Metrics */}
      <div className="mb-6">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <CardTitle className="text-sm font-medium">Live Database Metrics</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <LiveDatabaseMetrics />
          </CardContent>
        </Card>
      </div>

      {/* Storage Usage Card */}
      <div className="mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Storage Used</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-2xl font-bold">{formatFileSize(metrics.totalStorageSize)}</div>
                <div className="text-sm text-muted-foreground">
                  of {STORAGE_LIMIT_GB} GB
                </div>
              </div>
              <Progress 
                value={metrics.storageUsagePercentage} 
                className="h-2"
              />
            </div>
            <div className="space-y-2 pt-2">
              <StorageTypeRow
                icon={File}
                label="Documents"
                size={metrics.fileTypeMetrics.documents}
                total={metrics.totalStorageSize}
              />
              <StorageTypeRow
                icon={Image}
                label="Images"
                size={metrics.fileTypeMetrics.images}
                total={metrics.totalStorageSize}
              />
              <StorageTypeRow
                icon={Music}
                label="Audio"
                size={metrics.fileTypeMetrics.audio}
                total={metrics.totalStorageSize}
              />
              <StorageTypeRow
                icon={Video}
                label="Video"
                size={metrics.fileTypeMetrics.video}
                total={metrics.totalStorageSize}
              />
              <StorageTypeRow
                icon={FileQuestion}
                label="Other"
                size={metrics.fileTypeMetrics.other}
                total={metrics.totalStorageSize}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.userCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Flight Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.flightRecordCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.stockInventoryCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Temperature Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.temperatureControlCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Incoming Inspections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.incomingInspectionCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Technical Queries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.technicalQueryCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Audits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.auditCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.notificationCount}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 