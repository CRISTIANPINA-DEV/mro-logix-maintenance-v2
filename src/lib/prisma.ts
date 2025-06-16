import { PrismaClient } from "@prisma/client";
import { dbMetrics } from "./db-metrics";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getApproximateSize(data: any): number {
  try {
    // Handle null/undefined
    if (data == null) return 0;

    // Handle primitive types
    if (typeof data === 'string') return data.length;
    if (typeof data === 'number') return 8;
    if (typeof data === 'boolean') return 1;
    if (typeof data === 'bigint') return 8;

    // Handle arrays
    if (Array.isArray(data)) {
      return data.reduce((sum, item) => sum + getApproximateSize(item), 0);
    }

    // Handle objects
    if (typeof data === 'object') {
      return Object.entries(data).reduce((sum, [key, value]) => {
        return sum + key.length + getApproximateSize(value);
      }, 0);
    }

    return 0;
  } catch (error) {
    console.error('Error calculating data size:', error);
    return 0;
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error"],
  });

// Add middleware to track metrics
prisma.$use(async (params, next) => {
  const startTime = Date.now();
  
  // Get company ID from params if available
  const companyId = params.args?.where?.companyId || 
                   params.args?.data?.companyId ||
                   'unknown';

  // Determine if this is a read or write operation
  const isRead = ['findMany', 'findFirst', 'findUnique', 'count', 'aggregate', 'groupBy'].includes(params.action);
  const operation = isRead ? 'read' : 'write';

  // Execute the query
  const result = await next(params);

  // Calculate approximate data size
  const dataSize = getApproximateSize(result);

  // Track the operation
  dbMetrics.trackOperation(companyId, operation, dataSize);

  return result;
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma; 