import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { uploadAuditFile, uploadAuditFindingFile, uploadCorrectiveActionFile } from '@/lib/s3';
import { getServerSession } from '@/lib/auth';

// POST /api/audits/upload - Upload files for audits, findings, or corrective actions
export async function POST(request: NextRequest) {
  try {
    // Authenticate user to get company info
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const companyId = session.user.companyId;

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const entityType = formData.get('entityType') as string; // 'audit', 'finding', or 'action'
    const entityId = formData.get('entityId') as string;
    const category = formData.get('category') as string || 'general';
    const description = formData.get('description') as string || '';
    const uploadedBy = formData.get('uploadedBy') as string || '';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: 'Entity type and ID are required' },
        { status: 400 }
      );
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 50MB limit' },
        { status: 400 }
      );
    }

    // Verify entity ownership based on type
    let entityExists = false;
    switch (entityType) {
      case 'audit':
        const audit = await prisma.audit.findFirst({
          where: { id: entityId, companyId: companyId }
        });
        entityExists = !!audit;
        break;

      case 'finding':
        const finding = await prisma.auditFinding.findFirst({
          where: { 
            id: entityId,
            audit: { companyId: companyId }
          }
        });
        entityExists = !!finding;
        break;

      case 'action':
        const action = await prisma.correctiveAction.findFirst({
          where: {
            id: entityId,
            finding: {
              audit: { companyId: companyId }
            }
          }
        });
        entityExists = !!action;
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid entity type' },
          { status: 400 }
        );
    }

    if (!entityExists) {
      return NextResponse.json(
        { error: 'Entity not found or access denied' },
        { status: 404 }
      );
    }

    let fileKey: string;
    let attachmentData: any;

    // Upload file to S3 based on entity type
    switch (entityType) {
      case 'audit':
        fileKey = await uploadAuditFile(file, entityId, category, companyId);
        attachmentData = {
          fileName: file.name,
          fileKey,
          fileSize: file.size,
          fileType: file.type,
          description,
          category,
          auditId: entityId,
          uploadedBy: uploadedBy || null
        };
        break;

      case 'finding':
        fileKey = await uploadAuditFindingFile(file, entityId, category, companyId);
        attachmentData = {
          fileName: file.name,
          fileKey,
          fileSize: file.size,
          fileType: file.type,
          description,
          category,
          findingId: entityId,
          uploadedBy: uploadedBy || null
        };
        break;

      case 'action':
        fileKey = await uploadCorrectiveActionFile(file, entityId, category, companyId);
        attachmentData = {
          fileName: file.name,
          fileKey,
          fileSize: file.size,
          fileType: file.type,
          description,
          category,
          correctiveActionId: entityId,
          uploadedBy: uploadedBy || null
        };
        break;
    }

    // Save attachment record to database
    let attachment;
    switch (entityType) {
      case 'audit':
        attachment = await prisma.auditAttachment.create({
          data: attachmentData
        });
        // Update audit hasAttachments flag
        await prisma.audit.update({
          where: { id: entityId },
          data: { hasAttachments: true }
        });
        break;

      case 'finding':
        attachment = await prisma.auditFindingAttachment.create({
          data: attachmentData
        });
        // Update finding hasAttachments flag
        await prisma.auditFinding.update({
          where: { id: entityId },
          data: { hasAttachments: true }
        });
        break;

      case 'action':
        attachment = await prisma.correctiveActionAttachment.create({
          data: attachmentData
        });
        // Update corrective action hasAttachments flag
        await prisma.correctiveAction.update({
          where: { id: entityId },
          data: { hasAttachments: true }
        });
        break;
    }

    return NextResponse.json({
      message: 'File uploaded successfully',
      attachment,
      fileKey
    }, { status: 201 });

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
} 