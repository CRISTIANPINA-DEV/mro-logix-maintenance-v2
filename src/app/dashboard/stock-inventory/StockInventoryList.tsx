"use client";

import { useEffect, useState } from "react";
import { Package } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import Link from "next/link";
import React from "react";
import { useIsTabletLandscape } from "@/hooks/use-tablet-landscape";
import { useIsMobile } from "@/hooks/use-mobile";

interface StockInventory {
  id: string;
  incomingDate: string;
  station: string;
  owner: string;
  description: string;
  partNo: string;
  serialNo: string;
  quantity: string;
  hasExpireDate: boolean;
  expireDate: string | null;
  type: string;
  location: string;
  hasInspection: boolean;
  inspectionResult: string | null;
  inspectionFailure: string | null;
  customFailure: string | null;
  hasComment: boolean;
  comment: string | null;
  hasAttachments: boolean;
  Attachment: Array<{
    id: string;
    fileName: string;
    fileKey: string;
    fileSize: number;
    fileType: string;
  }>;
  IncomingInspection: Array<{
    id: string;
    inspectionDate: string;
    inspector: string;
  }>;
}

interface StockInventoryListProps {
  searchTerm: string;
}

interface SummaryCardProps {
  title: string;
  count: number;
  icon: React.ReactNode;
  color: {
    bg: string;
    text: string;
    border: string;
    icon: string;
  };
  isActive: boolean;
  onClick: () => void;
}

function SummaryCard({ title, count, icon, color, isActive, onClick }: SummaryCardProps) {
  return (
    <button
      onClick={onClick}
      className={`border rounded-lg px-2 py-1.5 flex items-center justify-between transition-colors cursor-pointer ${
        isActive ? color.bg : 'hover:bg-gray-50'
      }`}
    >
      <div>
        <div className={`text-[11px] font-medium ${color.text}`}>{title}</div>
        <div className={`text-base font-bold ${color.text}`}>{count}</div>
      </div>
      <div className={`h-6 w-6 rounded-full flex items-center justify-center border ${color.border} ml-1.5`}>
        {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: `h-3 w-3 ${color.icon}` })}
      </div>
    </button>
  );
}

export function StockInventoryList({ searchTerm }: StockInventoryListProps) {
  const [records, setRecords] = useState<StockInventory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'expired' | 'expiring' | 'current' | 'failed' | 'inspected' | null>(null);
  const { toast } = useToast();
  const isTabletLandscape = useIsTabletLandscape();
  const isMobile = useIsMobile();

  const filterOptions: ('current' | 'expiring' | 'expired' | 'failed' | 'inspected' | null)[] = [null, 'current', 'expiring', 'expired', 'failed', 'inspected'];

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const response = await fetch('/api/stock-inventory');
        const data = await response.json();
        
        if (data.success) {
          setRecords(data.records);
        } else {
          throw new Error(data.message || 'Failed to fetch records');
        }
      } catch (error) {
        console.error('Error fetching stock inventory records:', error);
        toast({
          title: "Error",
          description: "Failed to fetch stock inventory records",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecords();
  }, [toast]);

  // Filter records based on search term and active filter
  const filteredRecords = records.filter(record => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      record.partNo.toLowerCase().includes(searchLower) ||
      record.serialNo.toLowerCase().includes(searchLower) ||
      record.description.toLowerCase().includes(searchLower) ||
      record.station.toLowerCase().includes(searchLower) ||
      record.owner.toLowerCase().includes(searchLower) ||
      record.type.toLowerCase().includes(searchLower) ||
      record.location.toLowerCase().includes(searchLower)
    );

    if (!matchesSearch) return false;

    if (!activeFilter) return true;

    if (activeFilter === 'failed') {
      return record.hasInspection && record.inspectionResult === "Failed";
    }

    if (activeFilter === 'inspected') {
      return record.IncomingInspection && record.IncomingInspection.length > 0;
    }

    if (!record.hasExpireDate || !record.expireDate) return false;

    const today = new Date();
    const expiryDate = new Date(record.expireDate);
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    switch (activeFilter) {
      case 'expired':
        return diffDays <= 0;
      case 'expiring':
        return diffDays > 0 && diffDays <= 30;
      case 'current':
        return diffDays > 0;
      default:
        return true;
    }
  });

  const getSummaryCards = () => {
    const today = new Date();
    const allPartsCount = records.length;
    const expiredCount = records.filter(record => 
      record.hasExpireDate && record.expireDate && 
      new Date(record.expireDate).getTime() <= today.getTime()
    ).length;
    
    const expiringSoonCount = records.filter(record => {
      if (!record.hasExpireDate || !record.expireDate) return false;
      if (record.hasInspection && record.inspectionResult === "Failed") return false;
      const diffTime = new Date(record.expireDate).getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 && diffDays <= 30;
    }).length;
    
    const currentCount = records.filter(record => {
      if (!record.hasExpireDate || !record.expireDate) return false;
      if (record.hasInspection && record.inspectionResult === "Failed") return false;
      const diffTime = new Date(record.expireDate).getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0;
    }).length;

    const failedInspectionCount = records.filter(record => 
      record.hasInspection && record.inspectionResult === "Failed"
    ).length;

    const incomingInspectionCount = records.filter(record => 
      record.IncomingInspection && record.IncomingInspection.length > 0
    ).length;

    return [
      {
        title: "All Parts",
        count: allPartsCount,
        color: {
          bg: 'bg-white',
          text: 'text-gray-900',
          border: 'border-gray-200',
          icon: 'text-gray-500'
        }
      },
      {
        title: "Current Parts",
        count: currentCount,
        color: {
          bg: 'bg-green-50',
          text: 'text-green-800',
          border: 'border-green-200',
          icon: 'text-green-600'
        }
      },
      {
        title: "Expiring Soon",
        count: expiringSoonCount,
        color: {
          bg: 'bg-yellow-50',
          text: 'text-yellow-800',
          border: 'border-yellow-200',
          icon: 'text-yellow-600'
        }
      },
      {
        title: "Expired Parts",
        count: expiredCount,
        color: {
          bg: 'bg-red-50',
          text: 'text-red-800',
          border: 'border-red-200',
          icon: 'text-red-600'
        }
      },
      {
        title: "Failed Inspection",
        count: failedInspectionCount,
        color: {
          bg: 'bg-orange-50',
          text: 'text-orange-800',
          border: 'border-orange-200',
          icon: 'text-orange-600'
        }
      },
      {
        title: "Incoming Inspected",
        count: incomingInspectionCount,
        color: {
          bg: 'bg-pink-50',
          text: 'text-pink-800',
          border: 'border-pink-200',
          icon: 'text-pink-600'
        }
      }
    ];
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (filteredRecords.length === 0 && !isLoading) {
    return (
      <div className="border rounded-lg p-8 bg-card text-center">
        <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">
          {searchTerm ? "No records match your search" : "No stock inventory records yet"}
        </h3>
        <p className="text-muted-foreground">
          {searchTerm ? "Try a different search term." : "Your stock inventory records will appear here once you add them."}
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Summary Cards */}
      <div className={`grid gap-4 mb-4 ${isMobile ? 'grid-cols-3' : 'grid-cols-6'}`}>
        {getSummaryCards()
          .filter((card, index) => {
            // On mobile, only show All Parts (0), Expiring Soon (2), and Expired Parts (3)
            if (isMobile) {
              return index === 0 || index === 2 || index === 3;
            }
            // On tablet/desktop, show all cards
            return true;
          })
          .map((card, filteredIndex) => {
            // Get the original index for filterOptions mapping
            const originalIndex = isMobile 
              ? [0, 2, 3][filteredIndex] // Map filtered index back to original
              : getSummaryCards().findIndex(originalCard => originalCard.title === card.title);
            
            return (
              <SummaryCard
                key={card.title}
                {...card}
                icon={<Package />}
                isActive={activeFilter === filterOptions[originalIndex]}
                onClick={() => setActiveFilter(filterOptions[originalIndex])}
              />
            );
          })
        }
      </div>

      {/* Mobile Layout Info */}
      {isMobile && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            You&apos;re viewing a simplified layout optimized for Mobile. For all details, tap any item or switch to desktop view.
          </p>
        </div>
      )}

      {/* Reset Filter Button */}
      {activeFilter && (
        <div className="mb-4 flex justify-end">
          <button
            onClick={() => setActiveFilter(null)}
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
          >
            <span>Reset Filter</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
          </button>
        </div>
      )}

      <div className="overflow-x-auto w-full">
        <div className="border rounded-lg bg-card overflow-hidden">
          {/* Header Row */}
          <div className="py-2 px-3 border-b-[0.5px] sticky top-0 bg-card z-10">
            {isMobile ? (
              /* Mobile - Limited Columns (Date, Part No, Due date) */
              <div className="grid grid-cols-3 gap-x-3 text-sm font-semibold items-center whitespace-nowrap">
                <div className="col-span-1 truncate">Date</div>
                <div className="col-span-1 truncate">Part No</div>
                <div className="col-span-1 truncate">Due</div>
              </div>
            ) : isTabletLandscape ? (
              /* Tablet Landscape - Limited Columns */
              <div className="grid grid-cols-6 gap-x-3 text-sm font-semibold items-center whitespace-nowrap">
                <div className="col-span-1 truncate">Date</div>
                <div className="col-span-1 truncate">Owner</div>
                <div className="col-span-1 truncate">Part No</div>
                <div className="col-span-1 truncate">Location</div>
                <div className="col-span-1 truncate">Quantity</div>
                <div className="col-span-1 truncate">Days Left</div>
              </div>
            ) : (
              /* Desktop - All Columns */
              <div className="grid grid-cols-12 gap-x-3 text-sm font-semibold items-center whitespace-nowrap">
                <div className="col-span-1 truncate">Arrival Date</div>
                <div className="col-span-1 truncate">Station</div>
                <div className="col-span-1 truncate">Owner</div>
                <div className="col-span-1 truncate">Part No</div>
                <div className="col-span-1 truncate">Serial No</div>
                <div className="col-span-2 truncate">Description</div>
                <div className="col-span-1 truncate">Type</div>
                <div className="col-span-1 truncate">Location</div>
                <div className="col-span-1 truncate">Quantity</div>
                <div className="col-span-1 truncate">Due</div>
                <div className="col-span-1 truncate">Days Left</div>
              </div>
            )}
          </div>

          {/* Data Rows */}
          {filteredRecords.map((record) => (
            <Link
              key={record.id}
              href={`/dashboard/stock-inventory/${record.id}`}
              className="py-1 px-3 border-b-[0.5px] last:border-b-0 even:bg-gray-100/60 odd:bg-blue-50/60 hover:bg-accent hover:cursor-pointer transition-colors duration-200 block"
            >
              {isMobile ? (
                /* Mobile - Limited Columns (Date, Part No, Due date) */
                <div className="grid grid-cols-3 gap-x-3 text-sm items-center hover:text-accent-foreground whitespace-nowrap">
                  <div className="col-span-1 truncate" title={format(new Date(record.incomingDate), 'MMM dd, yyyy')}>
                    {format(new Date(record.incomingDate), 'MMM dd, yyyy')}
                  </div>
                  <div className="col-span-1 truncate" title={record.partNo}>{record.partNo}</div>
                  <div className="col-span-1 truncate">
                    {record.hasExpireDate && record.expireDate ? (
                      (() => {
                        const today = new Date();
                        const expiryDate = new Date(record.expireDate);
                        const diffTime = expiryDate.getTime() - today.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        
                        let bgColorClass = 'bg-gray-100 text-gray-800';
                        if (diffDays <= 0) {
                          bgColorClass = 'bg-red-100 text-red-800';
                        } else if (diffDays <= 30) {
                          bgColorClass = 'bg-yellow-100 text-yellow-800';
                        } else if (diffDays <= 90) {
                          bgColorClass = 'bg-orange-100 text-orange-800';
                        }

                        return (
                          <span className={`inline-flex items-center px-1 py-0.5 rounded-sm text-xs font-medium ${bgColorClass} leading-tight truncate`} 
                                title={format(new Date(record.expireDate), 'MMM dd, yyyy')}>
                            {format(new Date(record.expireDate), 'MM/dd/yy')}
                          </span>
                        );
                      })()
                    ) : (
                      <span className="inline-flex items-center px-1 py-0.5 rounded-sm text-xs font-medium bg-gray-100 text-gray-800 leading-tight truncate">
                        N/A
                      </span>
                    )}
                  </div>
                </div>
              ) : isTabletLandscape ? (
                /* Tablet Landscape - Limited Columns */
                <div className="grid grid-cols-6 gap-x-3 text-sm items-center hover:text-accent-foreground whitespace-nowrap">
                  <div className="col-span-1 truncate" title={format(new Date(record.incomingDate), 'MMM dd, yyyy')}>
                    {format(new Date(record.incomingDate), 'MMM dd, yyyy')}
                  </div>
                  <div className="col-span-1 truncate" title={record.owner}>{record.owner}</div>
                  <div className="col-span-1 truncate" title={record.partNo}>{record.partNo}</div>
                  <div className="col-span-1 truncate" title={record.location}>{record.location}</div>
                  <div className="col-span-1 truncate" title={record.quantity}>{record.quantity}</div>
                  <div className="col-span-1 truncate">
                    {record.hasInspection && record.inspectionResult === "Failed" ? (
                      <span className="inline-flex items-center px-1 py-0.5 rounded-sm text-xs font-medium bg-orange-100 text-orange-800 leading-tight truncate" 
                            title="Inspection Failed">
                        Insp. Failed
                      </span>
                    ) : record.hasExpireDate && record.expireDate ? (
                      (() => {
                        const today = new Date();
                        const expiryDate = new Date(record.expireDate);
                        const diffTime = expiryDate.getTime() - today.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        
                        let bgColorClass = 'bg-green-100 text-green-800';
                        if (diffDays <= 0) {
                          bgColorClass = 'bg-red-100 text-red-800';
                        } else if (diffDays <= 30) {
                          bgColorClass = 'bg-yellow-100 text-yellow-800';
                        } else if (diffDays <= 90) {
                          bgColorClass = 'bg-orange-100 text-orange-800';
                        }

                        return (
                          <span className={`inline-flex items-center px-1 py-0.5 rounded-sm text-xs font-medium ${bgColorClass} leading-tight truncate`} 
                                title={`${diffDays <= 0 ? 'Expired' : `${diffDays} days remaining`}`}>
                            {diffDays <= 0 ? 'Expired' : `${diffDays}d`}
                          </span>
                        );
                      })()
                    ) : (
                      <span className="inline-flex items-center px-1 py-0.5 rounded-sm text-xs font-medium bg-gray-100 text-gray-800 leading-tight truncate">
                        N/A
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                /* Desktop - All Columns */
                <div className="grid grid-cols-12 gap-x-3 text-sm items-center hover:text-accent-foreground whitespace-nowrap">
                  <div className="col-span-1 truncate" title={format(new Date(record.incomingDate), 'MMM dd, yyyy')}>
                    {format(new Date(record.incomingDate), 'MMM dd, yyyy')}
                  </div>
                  <div className="col-span-1 truncate" title={record.station}>{record.station}</div>
                  <div className="col-span-1 truncate" title={record.owner}>{record.owner}</div>
                  <div className="col-span-1 truncate" title={record.partNo}>{record.partNo}</div>
                  <div className="col-span-1 truncate" title={record.serialNo}>{record.serialNo}</div>
                  <div className={`col-span-2 truncate ${record.IncomingInspection && record.IncomingInspection.length > 0 ? 'bg-pink-100' : ''}`} title={record.description}>{record.description}</div>
                  <div className="col-span-1 truncate" title={record.type}>{record.type}</div>
                  <div className="col-span-1 truncate" title={record.location}>{record.location}</div>
                  <div className="col-span-1 truncate" title={record.quantity}>{record.quantity}</div>
                  <div className="col-span-1 truncate">
                    {record.hasExpireDate && record.expireDate ? (
                      (() => {
                        const today = new Date();
                        const expiryDate = new Date(record.expireDate);
                        const diffTime = expiryDate.getTime() - today.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        
                        let bgColorClass = 'bg-gray-100 text-gray-800';
                        if (diffDays <= 0) {
                          bgColorClass = 'bg-red-100 text-red-800';
                        } else if (diffDays <= 30) {
                          bgColorClass = 'bg-yellow-100 text-yellow-800';
                        } else if (diffDays <= 90) {
                          bgColorClass = 'bg-orange-100 text-orange-800';
                        }

                        return (
                          <span className={`inline-flex items-center px-1 py-0.5 rounded-sm text-xs font-medium ${bgColorClass} leading-tight truncate`} 
                                title={format(new Date(record.expireDate), 'MMM dd, yyyy')}>
                            {format(new Date(record.expireDate), 'MM/dd/yy')}
                          </span>
                        );
                      })()
                    ) : (
                      <span className="inline-flex items-center px-1 py-0.5 rounded-sm text-xs font-medium bg-gray-100 text-gray-800 leading-tight truncate">
                        N/A
                      </span>
                    )}
                  </div>
                  <div className="col-span-1 truncate">
                    {record.hasInspection && record.inspectionResult === "Failed" ? (
                      <span className="inline-flex items-center px-1 py-0.5 rounded-sm text-xs font-medium bg-orange-100 text-orange-800 leading-tight truncate" 
                            title="Inspection Failed">
                        Insp. Failed
                      </span>
                    ) : record.hasExpireDate && record.expireDate ? (
                      (() => {
                        const today = new Date();
                        const expiryDate = new Date(record.expireDate);
                        const diffTime = expiryDate.getTime() - today.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        
                        let bgColorClass = 'bg-green-100 text-green-800';
                        if (diffDays <= 0) {
                          bgColorClass = 'bg-red-100 text-red-800';
                        } else if (diffDays <= 30) {
                          bgColorClass = 'bg-yellow-100 text-yellow-800';
                        } else if (diffDays <= 90) {
                          bgColorClass = 'bg-orange-100 text-orange-800';
                        }

                        return (
                          <span className={`inline-flex items-center px-1 py-0.5 rounded-sm text-xs font-medium ${bgColorClass} leading-tight truncate`} 
                                title={`${diffDays <= 0 ? 'Expired' : `${diffDays} days remaining`}`}>
                            {diffDays <= 0 ? 'Expired' : `${diffDays}d`}
                          </span>
                        );
                      })()
                    ) : (
                      <span className="inline-flex items-center px-1 py-0.5 rounded-sm text-xs font-medium bg-gray-100 text-gray-800 leading-tight truncate">
                        N/A
                      </span>
                    )}
                  </div>
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}