"use client";

import { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FileText, 
  Calendar, 
  User, 
  MapPin, 
  Target, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Upload,
  Plus,
  Edit,
  Trash2,
  X,
  Building2,
  Users,
  ClipboardCheck
} from "lucide-react";

interface AuditDetailViewProps {
  auditId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface Audit {
  id: string;
  auditNumber: string;
  title: string;
  description?: string;
  type: string;
  status: string;
  scope?: string;
  department?: string;
  location?: string;
  plannedStartDate: string;
  plannedEndDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  leadAuditor: string;
  auditTeam: string[];
  auditee?: string;
  objectives?: string;
  criteria?: string;
  methodology?: string;
  executiveSummary?: string;
  conclusions?: string;
  recommendations?: string;
  overallRating?: string;
  complianceRate?: number;
  hasAttachments: boolean;
  isRecurring: boolean;
  recurringFrequency?: string;
  nextAuditDue?: string;
  findings: any[];
  attachments: any[];
  checklistItems: any[];
  _count: {
    findings: number;
    attachments: number;
    checklistItems: number;
  };
}

const AuditDetailView: React.FC<AuditDetailViewProps> = ({ auditId, isOpen, onClose }) => {
  const [audit, setAudit] = useState<Audit | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (isOpen && auditId) {
      fetchAuditDetails();
    }
  }, [isOpen, auditId]);

  useEffect(() => {
    // Set the app element for react-modal
    if (typeof window !== 'undefined') {
      const appElement = document.getElementById('__next') || document.body;
      Modal.setAppElement(appElement);
    }
  }, []);

  const fetchAuditDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/audits/${auditId}`);
      if (!response.ok) throw new Error('Failed to fetch audit details');
      const data = await response.json();
      setAudit(data);
    } catch (err) {
      setError('Failed to load audit details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNED': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'IN_PROGRESS': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'COMPLETED': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'CANCELLED': return 'bg-red-50 text-red-700 border-red-200';
      case 'DEFERRED': return 'bg-gray-50 text-gray-700 border-gray-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-50 text-red-700 border-red-200';
      case 'MAJOR': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'MINOR': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'NON_CRITICAL': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'OBSERVATION': return 'bg-gray-50 text-gray-700 border-gray-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const handleFileDownload = async (fileKey: string, fileName: string) => {
    try {
      const response = await fetch(`/api/audits/files/${encodeURIComponent(fileKey)}`);
      if (!response.ok) throw new Error('Failed to download file');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  if (!isOpen) return null;

  // Custom styles for react-modal
  const customStyles = {
    overlay: {
      backgroundColor: 'rgba(0, 0, 0, 0.60)',
      backdropFilter: 'blur(2px)',
      zIndex: 999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
    },
    content: {
      position: 'relative' as const,
      top: 'auto',
      left: 'auto',
      right: 'auto',
      bottom: 'auto',
      width: '100%',
      height: '100%',
      maxWidth: '95vw',
      maxHeight: '92vh',
      border: 'none',
      borderRadius: '0',
      padding: '0',
      overflow: 'hidden',
      background: 'white',
      boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
      margin: 'auto',
    },
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      style={customStyles}
      contentLabel="Audit Details"
      closeTimeoutMS={200}
      appElement={typeof window !== 'undefined' ? document.getElementById('__next') || document.body : undefined}
    >
      <div className="flex flex-col h-full bg-gray-50">
        {/* Ultra-Compact Header */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-md">
                <ClipboardCheck className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Audit Details</h1>
                <p className="text-xs text-gray-500">Complete audit information</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-7 w-7 p-0 hover:bg-gray-100 rounded-md"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          
          {/* Compact Header Info Bar */}
          {audit && (
            <div className="px-4 pb-3 bg-gray-50 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <h2 className="text-base font-medium text-gray-900">{audit.title}</h2>
                    <p className="text-xs text-gray-600">{audit.auditNumber}</p>
                  </div>
                  <Badge className={`${getStatusColor(audit.status)} text-xs font-medium px-2 py-0.5 border`}>
                    {audit.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(audit.plannedStartDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span>{audit.leadAuditor}</span>
                  </div>
                  {audit.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{audit.location}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {loading && (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          )}

          {error && (
            <div className="p-4">
              <Alert className="border-red-200 bg-red-50 py-2">
                <AlertTriangle className="h-3 w-3 text-red-600" />
                <AlertDescription className="text-red-700 text-xs">{error}</AlertDescription>
              </Alert>
            </div>
          )}

          {audit && (
            <div className="h-full">
              {/* Ultra-Compact Metrics Bar */}
              <div className="bg-white border-b border-gray-200 px-4 py-2">
                <div className="grid grid-cols-4 gap-3">
                  <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-md">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <AlertTriangle className="w-3 h-3 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-blue-700">{audit._count.findings}</p>
                      <p className="text-xs text-blue-600">Findings</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-emerald-50 rounded-md">
                    <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-emerald-700">{audit._count.checklistItems}</p>
                      <p className="text-xs text-emerald-600">Checklist</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-md">
                    <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                      <FileText className="w-3 h-3 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-orange-700">{audit._count.attachments}</p>
                      <p className="text-xs text-orange-600">Files</p>
                    </div>
                  </div>
                  {audit.complianceRate && (
                    <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-md">
                      <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                        <Target className="w-3 h-3 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-purple-700">{audit.complianceRate.toFixed(0)}%</p>
                        <p className="text-xs text-purple-600">Compliance</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Main Content with Tabs */}
              <div className="flex-1 overflow-y-auto p-4">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
                  <TabsList className="grid w-full grid-cols-5 mb-4 bg-gray-100 h-8">
                    <TabsTrigger value="overview" className="text-xs py-1">Overview</TabsTrigger>
                    <TabsTrigger value="findings" className="text-xs py-1">Findings</TabsTrigger>
                    <TabsTrigger value="checklist" className="text-xs py-1">Checklist</TabsTrigger>
                    <TabsTrigger value="attachments" className="text-xs py-1">Files</TabsTrigger>
                    <TabsTrigger value="summary" className="text-xs py-1">Summary</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4">
                    {/* Ultra-Compact Information Grid */}
                    <div className="grid grid-cols-3 gap-4">
                      {/* Basic Information */}
                      <Card className="border-gray-200">
                        <CardHeader className="pb-2 pt-3 px-3">
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Building2 className="w-3 h-3 text-gray-500" />
                            Basic Info
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 px-3 pb-3">
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                              <span className="text-gray-500 font-medium">Type:</span>
                              <span className="text-gray-900 font-medium">{audit.type}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500 font-medium">Dept:</span>
                              <span className="text-gray-900">{audit.department || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500 font-medium">Scope:</span>
                              <span className="text-gray-900">{audit.scope || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500 font-medium">Auditee:</span>
                              <span className="text-gray-900">{audit.auditee || 'N/A'}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Team Information */}
                      <Card className="border-gray-200">
                        <CardHeader className="pb-2 pt-3 px-3">
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Users className="w-3 h-3 text-gray-500" />
                            Team
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 px-3 pb-3 space-y-2">
                          <div>
                            <span className="text-xs text-gray-500 font-medium">Lead:</span>
                            <p className="text-xs font-medium text-gray-900">{audit.leadAuditor}</p>
                          </div>
                          {audit.auditTeam && audit.auditTeam.length > 0 && (
                            <div>
                              <span className="text-xs text-gray-500 font-medium">Members:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {audit.auditTeam.slice(0, 2).map((member, index) => (
                                  <Badge key={index} variant="outline" className="text-xs py-0 px-1 bg-gray-50">{member}</Badge>
                                ))}
                                {audit.auditTeam.length > 2 && (
                                  <Badge variant="outline" className="text-xs py-0 px-1 bg-gray-50">
                                    +{audit.auditTeam.length - 2}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Timeline */}
                      <Card className="border-gray-200">
                        <CardHeader className="pb-2 pt-3 px-3">
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Clock className="w-3 h-3 text-gray-500" />
                            Timeline
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 px-3 pb-3 space-y-2">
                          <div>
                            <span className="text-xs text-gray-500 font-medium">Planned:</span>
                            <p className="text-xs text-gray-900">
                              {new Date(audit.plannedStartDate).toLocaleDateString()} - {new Date(audit.plannedEndDate).toLocaleDateString()}
                            </p>
                          </div>
                          {(audit.actualStartDate || audit.actualEndDate) && (
                            <div>
                              <span className="text-xs text-gray-500 font-medium">Actual:</span>
                              <p className="text-xs text-gray-900">
                                {audit.actualStartDate ? new Date(audit.actualStartDate).toLocaleDateString() : 'Not started'} - {audit.actualEndDate ? new Date(audit.actualEndDate).toLocaleDateString() : 'Ongoing'}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    {/* Description and Objectives - Single Row */}
                    {(audit.description || audit.objectives || audit.criteria || audit.methodology) && (
                      <div className="grid grid-cols-2 gap-4">
                        {audit.description && (
                          <Card className="border-gray-200">
                            <CardHeader className="pb-2 pt-3 px-3">
                              <CardTitle className="text-sm font-medium">Description</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0 px-3 pb-3">
                              <p className="text-xs text-gray-700 leading-relaxed line-clamp-3">{audit.description}</p>
                            </CardContent>
                          </Card>
                        )}

                        {audit.objectives && (
                          <Card className="border-gray-200">
                            <CardHeader className="pb-2 pt-3 px-3">
                              <CardTitle className="text-sm font-medium">Objectives</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0 px-3 pb-3">
                              <p className="text-xs text-gray-700 leading-relaxed line-clamp-3">{audit.objectives}</p>
                            </CardContent>
                          </Card>
                        )}

                        {audit.criteria && (
                          <Card className="border-gray-200">
                            <CardHeader className="pb-2 pt-3 px-3">
                              <CardTitle className="text-sm font-medium">Criteria</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0 px-3 pb-3">
                              <p className="text-xs text-gray-700 leading-relaxed line-clamp-3">{audit.criteria}</p>
                            </CardContent>
                          </Card>
                        )}

                        {audit.methodology && (
                          <Card className="border-gray-200">
                            <CardHeader className="pb-2 pt-3 px-3">
                              <CardTitle className="text-sm font-medium">Methodology</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0 px-3 pb-3">
                              <p className="text-xs text-gray-700 leading-relaxed line-clamp-3">{audit.methodology}</p>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="findings" className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="text-base font-medium">Findings ({audit.findings.length})</h3>
                      <Button size="sm" className="h-7 text-xs">
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {audit.findings.map((finding) => (
                        <Card key={finding.id} className="border-gray-200">
                          <CardContent className="p-3">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <h4 className="text-sm font-medium text-gray-900">{finding.title}</h4>
                                <p className="text-xs text-gray-500">{finding.findingNumber}</p>
                              </div>
                              <div className="flex items-center gap-2 ml-3">
                                <Badge className={`text-xs px-2 py-0.5 border ${getSeverityColor(finding.severity)}`}>
                                  {finding.severity}
                                </Badge>
                                <Badge variant="outline" className="text-xs px-2 py-0.5 bg-gray-50">
                                  {finding.status.replace('_', ' ')}
                                </Badge>
                              </div>
                            </div>
                            <p className="text-xs text-gray-700 mb-2 leading-relaxed line-clamp-2">{finding.description}</p>
                            <div className="flex justify-between items-center text-xs text-gray-500">
                              <span>{finding.category || 'N/A'}</span>
                              <span>{finding.correctiveActions?.length || 0} actions</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="attachments" className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="text-base font-medium">Files ({audit.attachments.length})</h3>
                      <Button size="sm" className="h-7 text-xs">
                        <Upload className="h-3 w-3 mr-1" />
                        Upload
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {audit.attachments.map((attachment) => (
                        <Card key={attachment.id} className="border-gray-200">
                          <CardContent className="p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center">
                                <FileText className="h-3 w-3 text-blue-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-900 truncate">{attachment.fileName}</p>
                                <p className="text-xs text-gray-500">
                                  {(attachment.fileSize / 1024 / 1024).toFixed(1)} MB
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleFileDownload(attachment.fileKey, attachment.fileName)}
                              className="w-full h-6 text-xs"
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Download
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="summary" className="space-y-3">
                    <div className="space-y-3">
                      {audit.executiveSummary && (
                        <Card className="border-gray-200">
                          <CardHeader className="pb-2 pt-3 px-3">
                            <CardTitle className="text-sm font-medium">Executive Summary</CardTitle>
                          </CardHeader>
                          <CardContent className="pt-0 px-3 pb-3">
                            <p className="text-xs text-gray-700 leading-relaxed">{audit.executiveSummary}</p>
                          </CardContent>
                        </Card>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        {audit.conclusions && (
                          <Card className="border-gray-200">
                            <CardHeader className="pb-2 pt-3 px-3">
                              <CardTitle className="text-sm font-medium">Conclusions</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0 px-3 pb-3">
                              <p className="text-xs text-gray-700 leading-relaxed">{audit.conclusions}</p>
                            </CardContent>
                          </Card>
                        )}

                        {audit.recommendations && (
                          <Card className="border-gray-200">
                            <CardHeader className="pb-2 pt-3 px-3">
                              <CardTitle className="text-sm font-medium">Recommendations</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0 px-3 pb-3">
                              <p className="text-xs text-gray-700 leading-relaxed">{audit.recommendations}</p>
                            </CardContent>
                          </Card>
                        )}
                      </div>

                      {audit.overallRating && (
                        <Card className="border-gray-200">
                          <CardHeader className="pb-2 pt-3 px-3">
                            <CardTitle className="text-sm font-medium">Overall Rating</CardTitle>
                          </CardHeader>
                          <CardContent className="pt-0 px-3 pb-3">
                            <p className="text-base font-semibold text-gray-900">{audit.overallRating}</p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default AuditDetailView; 