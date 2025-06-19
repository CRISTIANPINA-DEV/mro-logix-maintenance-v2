export interface TechnicalPublication {
  id: string;
  companyId: string;
  revisionDate: Date;
  manualDescription: string;
  revisionNumber: string;
  owner: string;
  comment?: string;
  hasAttachments: boolean;
  uploadedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  attachments?: TechnicalPublicationAttachment[];
}

export interface TechnicalPublicationAttachment {
  id: string;
  companyId: string;
  fileName: string;
  fileKey: string;
  fileSize: number;
  fileType: string;
  technicalPublicationId: string;
  uploadedBy?: string;
  createdAt: Date;
  technicalPublication?: TechnicalPublication;
}

export interface TechnicalPublicationFormData {
  revisionDate: string;
  manualDescription: string;
  revisionNumber: string;
  owner: string;
  comment?: string;
  file?: File;
}

export interface TechnicalPublicationResponse {
  success: boolean;
  message?: string;
  records?: TechnicalPublication[];
  record?: TechnicalPublication;
  technicalPublicationId?: string;
} 