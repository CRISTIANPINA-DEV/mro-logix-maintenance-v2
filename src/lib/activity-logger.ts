import { prisma } from '@/lib/prisma';

export type ActivityAction = 
  | 'LOGIN'
  | 'LOGOUT'
  | 'ADDED_FLIGHT_RECORD'
  | 'DELETED_FLIGHT_RECORD'
  | 'UPDATED_FLIGHT_RECORD'
  | 'ADDED_STOCK_INVENTORY'
  | 'DELETED_STOCK_INVENTORY'
  | 'UPDATED_STOCK_INVENTORY'
  | 'ADDED_TEMPERATURE_CONTROL'
  | 'DELETED_TEMPERATURE_CONTROL'
  | 'UPDATED_TEMPERATURE_CONTROL'
  | 'ADDED_AIRPORT_ID'
  | 'DELETED_AIRPORT_ID'
  | 'UPDATED_AIRPORT_ID'
  | 'ADDED_INCOMING_INSPECTION'
  | 'DELETED_INCOMING_INSPECTION'
  | 'UPDATED_INCOMING_INSPECTION'
  | 'CREATED_TECHNICAL_QUERY'
  | 'UPDATED_TECHNICAL_QUERY'
  | 'DELETED_TECHNICAL_QUERY'
  | 'CREATED_TECHNICAL_QUERY_VOTE'
  | 'UPDATED_TECHNICAL_QUERY_VOTE'
  | 'REMOVED_TECHNICAL_QUERY_VOTE'
  | 'CREATED_TECHNICAL_QUERY_RESPONSE'
  | 'CREATED_TECHNICAL_QUERY_RESPONSE_VOTE'
  | 'UPDATED_TECHNICAL_QUERY_RESPONSE_VOTE'
  | 'REMOVED_TECHNICAL_QUERY_RESPONSE_VOTE'
  | 'UPDATED_TEMPERATURE_HUMIDITY_CONFIG'
  | 'CREATED_SMS_REPORT'
  | 'DELETED_SMS_REPORT'
  | 'CREATED_AUDIT'
  | 'UPDATED_AUDIT'
  | 'DELETED_AUDIT'
  | 'ADDED_MANUAL_COMMENT'
  | 'DOWNLOADED_MANUAL'
  | 'UPDATED_MANUAL_STATUS'
  | 'UPDATED_MANUAL'
  | 'DELETED_MANUAL'
  | 'DOWNLOADED_MANUAL_VERSION'
  | 'ADDED_SDR_REPORT';

export type ResourceType = 
  | 'FLIGHT_RECORD'
  | 'STOCK_INVENTORY'
  | 'TEMPERATURE_CONTROL'
  | 'AIRPORT_ID'
  | 'INCOMING_INSPECTION'
  | 'AUTHENTICATION'
  | 'TECHNICAL_QUERY'
  | 'TECHNICAL_QUERY_RESPONSE'
  | 'TEMPERATURE_HUMIDITY_CONFIG'
  | 'SMS_REPORT'
  | 'AUDIT'
  | 'MANUAL'
  | 'SDR_REPORT';

interface LogActivityParams {
  userId: string;
  action: ActivityAction;
  resourceType?: ResourceType;
  resourceId?: string;
  resourceTitle?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function logActivity({
  userId,
  action,
  resourceType,
  resourceId,
  resourceTitle,
  metadata,
  ipAddress,
  userAgent,
}: LogActivityParams): Promise<void> {
  try {
    // Get the user's company ID for the activity log
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true }
    });

    if (!user) {
      console.error('User not found for activity logging:', userId);
      return;
    }

    await prisma.userActivity.create({
      data: {
        userId,
        companyId: user.companyId,
        action,
        resourceType: resourceType || null,
        resourceId: resourceId || null,
        resourceTitle: resourceTitle || null,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    });
  } catch (error) {
    // Log the error but don't throw it to avoid breaking the main operation
    console.error('Failed to log user activity:', error);
  }
}

// Helper function to extract IP address and user agent from request
export function getRequestInfo(request: Request): { ipAddress?: string; userAgent?: string } {
  const ipAddress = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  return { ipAddress, userAgent };
} 