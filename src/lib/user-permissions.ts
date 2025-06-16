import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

export type UserPermissions = {
  canViewFlightRecords: boolean;
  canAddFlightRecords: boolean;
  canExportFlightRecords: boolean;
  canEditFlightRecords: boolean;
  canExportPdfFlightRecords: boolean;
  canDeleteFlightRecords: boolean;
  canViewStockInventory: boolean;
  canGenerateStockReport: boolean;
  canAddStockItem: boolean;
  canGenerateStockPdf: boolean;
  canDeleteStockRecord: boolean;
  canViewIncomingInspections: boolean;
  canAddIncomingInspections: boolean;
  canDeleteIncomingInspections: boolean;
  canConfigureTemperatureRanges: boolean;
  canAddTemperatureRecord: boolean;
  canDeleteTemperatureRecord: boolean;
  canSeeAuditManagement: boolean;
};

export async function getUserPermissions(userId: string): Promise<UserPermissions | null> {
  try {
    const permissions = await prisma.userPermission.findUnique({
      where: { userId },
    });

    if (!permissions) {
      // Return default permissions if none exist
      return {
        canViewFlightRecords: true,
        canAddFlightRecords: true,
        canExportFlightRecords: false,
        canEditFlightRecords: false,
        canExportPdfFlightRecords: false,
        canDeleteFlightRecords: false,
        canViewStockInventory: false,
        canGenerateStockReport: false,
        canAddStockItem: false,
        canGenerateStockPdf: false,
        canDeleteStockRecord: false,
        canViewIncomingInspections: true,
        canAddIncomingInspections: false,
        canDeleteIncomingInspections: false,
        canConfigureTemperatureRanges: false,
        canAddTemperatureRecord: false,
        canDeleteTemperatureRecord: false,
        canSeeAuditManagement: false,
      };
    }

    return {
      canViewFlightRecords: permissions.canViewFlightRecords,
      canAddFlightRecords: permissions.canAddFlightRecords,
      canExportFlightRecords: permissions.canExportFlightRecords,
      canEditFlightRecords: permissions.canEditFlightRecords,
      canExportPdfFlightRecords: permissions.canExportPdfFlightRecords,
      canDeleteFlightRecords: permissions.canDeleteFlightRecords,
      canViewStockInventory: permissions.canViewStockInventory,
      canGenerateStockReport: permissions.canGenerateStockReport,
      canAddStockItem: permissions.canAddStockItem,
      canGenerateStockPdf: permissions.canGenerateStockPdf,
      canDeleteStockRecord: permissions.canDeleteStockRecord,
      canViewIncomingInspections: permissions.canViewIncomingInspections,
      canAddIncomingInspections: permissions.canAddIncomingInspections,
      canDeleteIncomingInspections: permissions.canDeleteIncomingInspections,
      canConfigureTemperatureRanges: permissions.canConfigureTemperatureRanges,
      canAddTemperatureRecord: permissions.canAddTemperatureRecord,
      canDeleteTemperatureRecord: permissions.canDeleteTemperatureRecord,
      canSeeAuditManagement: permissions.canSeeAuditManagement,
    };
  } catch (error) {
    console.error("Error fetching user permissions:", error);
    return null;
  }
}

export async function getCurrentUserPermissions(): Promise<UserPermissions | null> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return null;
    }

    return await getUserPermissions(session.user.id);
  } catch (error) {
    console.error("Error fetching current user permissions:", error);
    return null;
  }
}

export async function canUserAccessFlightRecords(userId: string): Promise<boolean> {
  const permissions = await getUserPermissions(userId);
  return permissions?.canViewFlightRecords ?? true;
}

export async function canUserAddFlightRecords(userId: string): Promise<boolean> {
  const permissions = await getUserPermissions(userId);
  return permissions?.canAddFlightRecords ?? true;
}

export async function canUserExportFlightRecords(userId: string): Promise<boolean> {
  const permissions = await getUserPermissions(userId);
  return permissions?.canExportFlightRecords ?? false;
}

export async function canUserViewIncomingInspections(userId: string): Promise<boolean> {
  const permissions = await getUserPermissions(userId);
  return permissions?.canViewIncomingInspections ?? false;
}

export async function canUserAddIncomingInspections(userId: string): Promise<boolean> {
  const permissions = await getUserPermissions(userId);
  return permissions?.canAddIncomingInspections ?? false;
}

export async function canUserDeleteIncomingInspections(userId: string): Promise<boolean> {
  const permissions = await getUserPermissions(userId);
  return permissions?.canDeleteIncomingInspections ?? false;
}

export async function canUserConfigureTemperatureRanges(userId: string): Promise<boolean> {
  const permissions = await getUserPermissions(userId);
  return permissions?.canConfigureTemperatureRanges ?? false;
}

export async function canUserAddTemperatureRecord(userId: string): Promise<boolean> {
  try {
    // First check if the user is an admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { privilege: true }
    });

    if (user?.privilege === 'admin') {
      return true;
    }

    // If not admin, check specific permission
    const permissions = await getUserPermissions(userId);
    return permissions?.canAddTemperatureRecord ?? false;
  } catch (error) {
    console.error("Error checking temperature add permission:", error);
    return false;
  }
}

export async function canUserDeleteTemperatureRecord(userId: string): Promise<boolean> {
  try {
    // First check if the user is an admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { privilege: true }
    });

    if (user?.privilege === 'admin') {
      return true;
    }

    // If not admin, check specific permission
    const permissions = await getUserPermissions(userId);
    return permissions?.canDeleteTemperatureRecord ?? false;
  } catch (error) {
    console.error("Error checking temperature delete permission:", error);
    return false;
  }
}

export async function canUserSeeAuditManagement(userId: string): Promise<boolean> {
  const permissions = await getUserPermissions(userId);
  return permissions?.canSeeAuditManagement ?? false;
} 