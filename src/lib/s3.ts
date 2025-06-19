import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET!;
const FLIGHT_RECORDS_FOLDER = 'flight-records';
const TECHNICIAN_TRAINING_FOLDER = 'technician-training';
const INCOMING_INSPECTION_FOLDER = 'incoming-inspections';
const SMS_REPORTS_FOLDER = 'sms-reports';
const AUDITS_FOLDER = 'audits';
const DOCUMENT_STORAGE_FOLDER = 'document-storage';
const MANUALS_FOLDER = 'manuals';
const AIRPORT_ID_FOLDER = 'airport-id';
const SDR_REPORTS_FOLDER = 'sdr-reports';
const TECHNICAL_PUBLICATIONS_FOLDER = 'technical-publications';

// Helper to upload a file
async function uploadToSupabase(file: File, path: string, options?: { upsert?: boolean }) {
  const { data, error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: options?.upsert ?? false });
  if (error) throw error;
  return data.path;
}

// Helper to download a file
async function downloadFromSupabase(path: string): Promise<Blob | null> {
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error) return null;
  return data;
}

// Helper to delete a file
async function deleteFromSupabase(path: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw error;
}

// Helper to get public URL
function getPublicUrl(path: string): string {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl || '';
}

// Flight Records - Updated with company-based folder structure
export async function uploadFlightRecordFile(file: File, flightRecordId: string, companyId?: string): Promise<string> {
  const fileName = `${flightRecordId}/${Date.now()}-${file.name}`;
  // Include company ID in the path for complete isolation
  const key = companyId 
    ? `${FLIGHT_RECORDS_FOLDER}/${companyId}/${fileName}`
    : `${FLIGHT_RECORDS_FOLDER}/${fileName}`;
  return uploadToSupabase(file, key);
}
export function getFileUrl(fileKey: string): string {
  return getPublicUrl(fileKey);
}
export async function getFlightRecordFile(fileKey: string): Promise<Blob | null> {
  return downloadFromSupabase(fileKey);
}
export async function deleteFlightRecordFile(fileKey: string): Promise<void> {
  return deleteFromSupabase(fileKey);
}

// Stock Inventory - Updated with company-based folder structure
export async function uploadStockInventoryFile(file: File, stockInventoryId: string, companyId?: string): Promise<string> {
  const fileName = `${stockInventoryId}/${Date.now()}-${file.name}`;
  // Include company ID in the path for complete isolation
  const fileKey = companyId 
    ? `stock-inventory/${companyId}/${fileName}`
    : `stock-inventory/${fileName}`;
  return uploadToSupabase(file, fileKey);
}
export async function getStockInventoryFile(fileKey: string): Promise<Blob | null> {
  return downloadFromSupabase(fileKey);
}
export async function deleteStockInventoryFile(fileKey: string): Promise<void> {
  return deleteFromSupabase(fileKey);
}

// Technician Training - Updated with company-based folder structure
export async function uploadTechnicianTrainingFile(file: File, technicianTrainingId: string, companyId?: string): Promise<string> {
  const fileName = `${technicianTrainingId}/${Date.now()}-${file.name}`;
  // Include company ID in the path for complete isolation
  const key = companyId 
    ? `${TECHNICIAN_TRAINING_FOLDER}/${companyId}/${fileName}`
    : `${TECHNICIAN_TRAINING_FOLDER}/${fileName}`;
  return uploadToSupabase(file, key);
}
export async function deleteTechnicianTrainingFile(fileKey: string): Promise<void> {
  return deleteFromSupabase(fileKey);
}
export async function getTechnicianTrainingFile(fileKey: string): Promise<Blob | null> {
  return downloadFromSupabase(fileKey);
}

// Incoming Inspection - Updated with company-based folder structure
export async function uploadIncomingInspectionFile(file: File, incomingInspectionId: string, companyId?: string): Promise<string> {
  const fileName = `${incomingInspectionId}/${Date.now()}-${file.name}`;
  // Include company ID in the path for complete isolation
  const key = companyId 
    ? `${INCOMING_INSPECTION_FOLDER}/${companyId}/${fileName}`
    : `${INCOMING_INSPECTION_FOLDER}/${fileName}`;
  return uploadToSupabase(file, key);
}
export async function deleteIncomingInspectionFile(fileKey: string): Promise<void> {
  return deleteFromSupabase(fileKey);
}
export async function getIncomingInspectionFile(fileKey: string): Promise<Blob | null> {
  return downloadFromSupabase(fileKey);
}

// Document Storage - Updated with company-based folder structure
export async function uploadDocumentFile(file: File, userId: string, folderPath?: string, isManual: boolean = false, companyId?: string): Promise<string> {
  const timestamp = Date.now();
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  let filePath;
  if (isManual) {
    // Include company ID in the path for complete isolation
    filePath = companyId 
      ? `${MANUALS_FOLDER}/${companyId}/${userId}/${timestamp}-${sanitizedFileName}`
      : `${MANUALS_FOLDER}/${userId}/${timestamp}-${sanitizedFileName}`;
  } else {
    filePath = `${DOCUMENT_STORAGE_FOLDER}/${userId}`;
    if (folderPath) filePath += `/${folderPath}`;
    filePath += `/${timestamp}-${sanitizedFileName}`;
  }
  return uploadToSupabase(file, filePath);
}
export async function getDocumentFile(fileKey: string): Promise<Blob | null> {
  return downloadFromSupabase(fileKey);
}
export async function deleteDocumentFile(fileKey: string): Promise<void> {
  return deleteFromSupabase(fileKey);
}
export function getDocumentFileUrl(fileKey: string): string {
  return getPublicUrl(fileKey);
}

// Airport ID - Updated with company-based folder structure
export async function uploadAirportIdFile(file: File, airportId: string, companyId?: string): Promise<string> {
  const fileName = `${airportId}/${Date.now()}-${file.name}`;
  // Include company ID in the path for complete isolation
  const key = companyId 
    ? `${AIRPORT_ID_FOLDER}/${companyId}/${fileName}`
    : `${AIRPORT_ID_FOLDER}/${fileName}`;
  return uploadToSupabase(file, key);
}
export async function deleteAirportIdFile(fileKey: string): Promise<void> {
  return deleteFromSupabase(fileKey);
}
export async function getAirportIdFile(fileKey: string): Promise<Blob | null> {
  return downloadFromSupabase(fileKey);
}

// SMS Reports - Updated with company-based folder structure
export async function uploadSMSReportFile(file: File, smsReportId: string, companyId?: string): Promise<string> {
  const fileName = `${smsReportId}/${Date.now()}-${file.name}`;
  // Include company ID in the path for complete isolation
  const key = companyId 
    ? `${SMS_REPORTS_FOLDER}/${companyId}/${fileName}`
    : `${SMS_REPORTS_FOLDER}/${fileName}`;
  return uploadToSupabase(file, key);
}
export async function getSMSReportFile(fileKey: string): Promise<Blob | null> {
  return downloadFromSupabase(fileKey);
}
export async function deleteSMSReportFile(fileKey: string): Promise<void> {
  return deleteFromSupabase(fileKey);
}

// SDR Reports - Updated with company-based folder structure
export async function uploadSDRReportFile(file: File, sdrReportId: string, companyId?: string): Promise<string> {
  const fileName = `${sdrReportId}/${Date.now()}-${file.name}`;
  // Include company ID in the path for complete isolation
  const key = companyId 
    ? `${SDR_REPORTS_FOLDER}/${companyId}/${fileName}`
    : `${SDR_REPORTS_FOLDER}/${fileName}`;
  return uploadToSupabase(file, key);
}
export async function getSDRReportFile(fileKey: string): Promise<Blob | null> {
  return downloadFromSupabase(fileKey);
}
export async function deleteSDRReportFile(fileKey: string): Promise<void> {
  return deleteFromSupabase(fileKey);
}

// Audits Management - Updated with company-based folder structure
export async function uploadAuditFile(file: File, auditId: string, category?: string, companyId?: string): Promise<string> {
  const timestamp = Date.now();
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  let fileName = `${auditId}/${timestamp}-${sanitizedFileName}`;
  if (category) fileName = `${auditId}/${category}/${timestamp}-${sanitizedFileName}`;
  // Include company ID in the path for complete isolation
  const key = companyId 
    ? `${AUDITS_FOLDER}/${companyId}/${fileName}`
    : `${AUDITS_FOLDER}/${fileName}`;
  return uploadToSupabase(file, key);
}
export async function getAuditFile(fileKey: string): Promise<Blob | null> {
  return downloadFromSupabase(fileKey);
}
export async function deleteAuditFile(fileKey: string): Promise<void> {
  return deleteFromSupabase(fileKey);
}
export async function uploadAuditFindingFile(file: File, findingId: string, category?: string, companyId?: string): Promise<string> {
  const timestamp = Date.now();
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  let fileName = `findings/${findingId}/${timestamp}-${sanitizedFileName}`;
  if (category) fileName = `findings/${findingId}/${category}/${timestamp}-${sanitizedFileName}`;
  // Include company ID in the path for complete isolation
  const key = companyId 
    ? `${AUDITS_FOLDER}/${companyId}/${fileName}`
    : `${AUDITS_FOLDER}/${fileName}`;
  return uploadToSupabase(file, key);
}
export async function deleteAuditFindingFile(fileKey: string): Promise<void> {
  return deleteFromSupabase(fileKey);
}
export async function uploadCorrectiveActionFile(file: File, correctiveActionId: string, category?: string, companyId?: string): Promise<string> {
  const timestamp = Date.now();
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  let fileName = `corrective-actions/${correctiveActionId}/${timestamp}-${sanitizedFileName}`;
  if (category) fileName = `corrective-actions/${correctiveActionId}/${category}/${timestamp}-${sanitizedFileName}`;
  // Include company ID in the path for complete isolation
  const key = companyId 
    ? `${AUDITS_FOLDER}/${companyId}/${fileName}`
    : `${AUDITS_FOLDER}/${fileName}`;
  return uploadToSupabase(file, key);
}
export async function deleteCorrectiveActionFile(fileKey: string): Promise<void> {
  return deleteFromSupabase(fileKey);
}

// Technical Publications - Company-based folder structure
export async function uploadTechnicalPublicationFile(file: File, technicalPublicationId: string, companyId?: string): Promise<string> {
  const fileName = `${technicalPublicationId}/${Date.now()}-${file.name}`;
  // Include company ID in the path for complete isolation
  const key = companyId 
    ? `${TECHNICAL_PUBLICATIONS_FOLDER}/${companyId}/${fileName}`
    : `${TECHNICAL_PUBLICATIONS_FOLDER}/${fileName}`;
  return uploadToSupabase(file, key);
}
export async function getTechnicalPublicationFile(fileKey: string): Promise<Blob | null> {
  return downloadFromSupabase(fileKey);
}
export async function deleteTechnicalPublicationFile(fileKey: string): Promise<void> {
  return deleteFromSupabase(fileKey);
}