"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import StockInventoryHeader from './log-pages-header';
import { useState, useEffect, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

interface Attachment {
  id: string;
  // Add other attachment properties if needed
}

interface FlightRecord {
  id: string;
  tail: string;
  logPageNo: string;
  hasAttachments: boolean;
  Attachment: Attachment[];
}

export default function StockInventoryPage() {
  // State for live statistics
  const [loading, setLoading] = useState(true);
  const [totalAttachments, setTotalAttachments] = useState(0);
  // One row per flight record that has log page attachments
  const [logPages, setLogPages] = useState<{ id: string; tail: string; logPage: string; count: number }[]>([]);
  const [search, setSearch] = useState("");

  const filteredPages = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return logPages;
    return logPages.filter(p =>
      p.tail.toLowerCase().includes(term) ||
      p.logPage.toLowerCase().includes(term)
    );
  }, [search, logPages]);

  // Fetch stats from the existing API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/flight-records');
        const data = await res.json();

        if (data.success && Array.isArray(data.records)) {
          const records = data.records as FlightRecord[];
          const attachments = records.reduce((sum: number, rec: FlightRecord) => 
            sum + (Array.isArray(rec.Attachment) ? rec.Attachment.length : 0), 0);

          setTotalAttachments(attachments);

          // Prepare list where each record appears once with its total attachment count
          const rows: { id: string; tail: string; logPage: string; count: number }[] = [];

          records.forEach((rec: FlightRecord) => {
            const attachmentCount = Array.isArray(rec.Attachment) ? rec.Attachment.length : 0;
            if (attachmentCount > 0) {
              rows.push({
                id: rec.id,
                tail: rec.tail || "-",
                logPage: rec.logPageNo || "-",
                count: attachmentCount,
              });
            }
          });

          setLogPages(rows);
        }
      } catch (err) {
        console.error('Error fetching flight record stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-full mx-auto px-2 pt-1 pb-10">
      <StockInventoryHeader />
      <div className="space-y-6">
        {/* Adjust grid to handle 3 items */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3"> 
          <Card> 
            <CardHeader className="text-center py-2">
              <CardTitle className="text-sm">Total Log Pages</CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              {loading ? (
                <div className="flex justify-center py-1">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                </div>
              ) : (
                <div className="space-y-0.5 text-center">
                  <p className="text-2xl font-bold">{totalAttachments}</p>
                  <p className="text-xs text-muted-foreground">Total Attachments</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Search Card */}
          <Card> 
            <CardHeader className="text-center py-2">
              <CardTitle className="text-sm">Search Log Pages</CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <div className="relative">
                <Input
                  placeholder="Search tail or log page..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pr-8 h-8 text-sm"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Placeholder third card can remain or be repurposed */}
          <div />

        </div>

        {/* Log Pages Table */}
        <div className="border rounded-lg bg-card overflow-hidden min-h-[450px]">
          <div className="overflow-x-auto h-full">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredPages.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground h-64 flex items-center justify-center">No log pages recorded</div>
            ) : (
              <Table className="[&_tr]:h-10 [&_td]:py-2 [&_th]:py-2 [&_td]:px-3 [&_th]:px-3 text-sm">
                <TableHeader>
                  <TableRow className="border-b">
                    <TableHead className="h-10 font-medium">Tail</TableHead>
                    <TableHead className="h-10 font-medium">Log Page</TableHead>
                    <TableHead className="h-10 font-medium text-right">Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPages.map((page, idx) => (
                    <TableRow key={idx} className="border-b hover:bg-muted/50">
                      <TableCell className="whitespace-nowrap">{page.tail}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Link href={`/dashboard/flight-records/${page.id}`} className="text-blue-600 underline hover:text-blue-800">
                          {page.logPage}
                        </Link>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right">{page.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

        {/* You can add more sections/cards below, they will stack vertically due to space-y-6 */}
      </div>
    </div>
  );
}
