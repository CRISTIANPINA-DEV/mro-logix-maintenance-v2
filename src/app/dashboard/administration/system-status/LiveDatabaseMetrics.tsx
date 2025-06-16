'use client';

import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DatabaseMetrics {
  reads: number;
  writes: number;
  bytesRead: number;
  bytesWritten: number;
  lastReset: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B/s';
  const k = 1024;
  const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatTotalBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function LiveDatabaseMetrics() {
  const [metrics, setMetrics] = useState<DatabaseMetrics | null>(null);
  const [prevMetrics, setPrevMetrics] = useState<DatabaseMetrics | null>(null);

  useEffect(() => {
    const eventSource = new EventSource('/api/metrics');

    eventSource.onmessage = (event) => {
      const newMetrics = JSON.parse(event.data);
      setPrevMetrics(metrics);
      setMetrics(newMetrics);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  if (!metrics) {
    return <div>Loading metrics...</div>;
  }

  // Calculate rates (operations per second)
  const readRate = prevMetrics ? metrics.reads - prevMetrics.reads : 0;
  const writeRate = prevMetrics ? metrics.writes - prevMetrics.writes : 0;
  const bytesReadRate = prevMetrics ? metrics.bytesRead - prevMetrics.bytesRead : 0;
  const bytesWrittenRate = prevMetrics ? metrics.bytesWritten - prevMetrics.bytesWritten : 0;

  return (
    <div className="space-y-2">
      <Table className="[&_tr]:border-b-0">
        <TableHeader>
          <TableRow className="hover:bg-transparent [&_th]:py-2 [&_th]:text-muted-foreground">
            <TableHead>Metric</TableHead>
            <TableHead className="text-right">Current Rate</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow className="hover:bg-transparent [&_td]:py-1">
            <TableCell className="font-medium">
              <div className="flex items-center gap-2">
                <ArrowDown className="h-3.5 w-3.5 text-blue-500" />
                Read Operations
              </div>
            </TableCell>
            <TableCell className="text-right tabular-nums">{readRate}/s</TableCell>
            <TableCell className="text-right tabular-nums">{metrics.reads.toLocaleString()}</TableCell>
          </TableRow>
          <TableRow className="hover:bg-transparent [&_td]:py-1">
            <TableCell className="font-medium">
              <div className="flex items-center gap-2">
                <ArrowUp className="h-3.5 w-3.5 text-green-500" />
                Write Operations
              </div>
            </TableCell>
            <TableCell className="text-right tabular-nums">{writeRate}/s</TableCell>
            <TableCell className="text-right tabular-nums">{metrics.writes.toLocaleString()}</TableCell>
          </TableRow>
          <TableRow className="hover:bg-transparent [&_td]:py-1">
            <TableCell className="font-medium">Data Read</TableCell>
            <TableCell className="text-right tabular-nums">{formatBytes(bytesReadRate)}</TableCell>
            <TableCell className="text-right tabular-nums">{formatTotalBytes(metrics.bytesRead)}</TableCell>
          </TableRow>
          <TableRow className="hover:bg-transparent [&_td]:py-1">
            <TableCell className="font-medium">Data Written</TableCell>
            <TableCell className="text-right tabular-nums">{formatBytes(bytesWrittenRate)}</TableCell>
            <TableCell className="text-right tabular-nums">{formatTotalBytes(metrics.bytesWritten)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <div className="text-xs text-muted-foreground">
        Last reset: {new Date(metrics.lastReset).toLocaleString()}
      </div>
    </div>
  );
} 