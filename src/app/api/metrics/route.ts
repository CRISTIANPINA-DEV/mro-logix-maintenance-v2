import { dbMetrics } from "@/lib/db-metrics";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

function convertBigIntToNumber(data: any): any {
  if (typeof data === 'bigint') {
    return Number(data);
  }
  if (Array.isArray(data)) {
    return data.map(convertBigIntToNumber);
  }
  if (data && typeof data === 'object') {
    return Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, convertBigIntToNumber(value)])
    );
  }
  return data;
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.privilege !== "admin") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const companyId = session.user.companyId;

  // Set up SSE headers
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendMetrics = () => {
        const metrics = dbMetrics.getMetrics(companyId);
        // Convert any BigInt values before sending
        const safeMetrics = convertBigIntToNumber(metrics);
        const data = `data: ${JSON.stringify(safeMetrics)}\n\n`;
        controller.enqueue(encoder.encode(data));
      };

      // Send initial metrics
      sendMetrics();

      // Send metrics every second
      const interval = setInterval(sendMetrics, 1000);

      // Clean up on close
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
} 