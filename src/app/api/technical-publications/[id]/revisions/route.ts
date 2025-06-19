import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Verify the publication exists and belongs to the user's company
    const publication = await prisma.technicalPublication.findFirst({
      where: {
        id,
        companyId: session.user.companyId
      }
    });

    if (!publication) {
      return NextResponse.json(
        { success: false, message: 'Technical publication not found' },
        { status: 404 }
      );
    }

    // Fetch revision history for the publication
    const revisions = await prisma.technicalPublicationRevision.findMany({
      where: {
        technicalPublicationId: id,
        companyId: session.user.companyId
      },
      include: {
        modifier: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        modifiedAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      revisions,
    });
  } catch (error) {
    console.error('Error fetching revision history:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch revision history' },
      { status: 500 }
    );
  }
} 