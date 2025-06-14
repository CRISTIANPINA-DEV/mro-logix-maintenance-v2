"use client";

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Filter,
  Download,
  AlertTriangle,
  Clock,
  CheckCircle
} from "lucide-react";

interface AuditEvent {
  id: string;
  title: string;
  auditNumber: string;
  type: string;
  status: string;
  plannedStartDate: string;
  plannedEndDate: string;
  leadAuditor: string;
  department?: string;
  location?: string;
}

interface AuditCalendarProps {
  onAuditSelect?: (audit: AuditEvent) => void;
}

const AuditCalendar: React.FC<AuditCalendarProps> = ({ onAuditSelect }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [audits, setAudits] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const auditTypes = ['INTERNAL', 'EXTERNAL', 'SAFETY', 'COMPLIANCE', 'QUALITY', 'REGULATORY', 'CUSTOMER'];

  useEffect(() => {
    fetchAudits();
  }, [currentDate]);

  const fetchAudits = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Calculate date range for the current view
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const response = await fetch(`/api/audits?limit=100`);
      if (!response.ok) throw new Error('Failed to fetch audits');
      
      const data = await response.json();
      setAudits(data.audits || []);
    } catch (err) {
      setError('Failed to load audit calendar');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
      case 'DEFERRED': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'INTERNAL': return 'bg-purple-50 border-l-purple-500';
      case 'EXTERNAL': return 'bg-blue-50 border-l-blue-500';
      case 'SAFETY': return 'bg-red-50 border-l-red-500';
      case 'COMPLIANCE': return 'bg-green-50 border-l-green-500';
      case 'QUALITY': return 'bg-yellow-50 border-l-yellow-500';
      case 'REGULATORY': return 'bg-orange-50 border-l-orange-500';
      case 'CUSTOMER': return 'bg-pink-50 border-l-pink-500';
      default: return 'bg-gray-50 border-l-gray-500';
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getAuditsForDate = (date: Date | null) => {
    if (!date) return [];
    
    return audits.filter(audit => {
      const startDate = new Date(audit.plannedStartDate);
      const endDate = new Date(audit.plannedEndDate);
      
      // Check if the date falls within the audit period
      return date >= new Date(startDate.toDateString()) && 
             date <= new Date(endDate.toDateString());
    }).filter(audit => 
      selectedTypes.length === 0 || selectedTypes.includes(audit.type)
    );
  };

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isWeekend = (date: Date | null) => {
    if (!date) return false;
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  const days = getDaysInMonth();

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading calendar...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('prev')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-xl font-semibold min-w-[200px] text-center">
                  {formatMonth(currentDate)}
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('next')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'month' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('month')}
                >
                  Month
                </Button>
                <Button
                  variant={viewMode === 'week' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('week')}
                >
                  Week
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Select
                value={selectedTypes.length === 0 ? "all" : selectedTypes.join(',')}
                onValueChange={(value) => setSelectedTypes(value === "all" ? [] : value.split(','))}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {auditTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button variant="export" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button variant="neutral" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule Audit
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Schedule New Audit</DialogTitle>
                  </DialogHeader>
                  <p className="text-gray-600">Quick scheduling form will be implemented here.</p>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
      </Card>

      {error && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-6">
          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center font-medium text-gray-500 text-sm">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((date, index) => {
              const auditsForDate = getAuditsForDate(date);
              const isCurrentDay = isToday(date);
              const isWeekendDay = isWeekend(date);

              return (
                <div
                  key={index}
                  className={`
                    min-h-[120px] p-2 border border-gray-200 rounded-lg
                    ${date ? 'bg-white hover:bg-gray-50' : 'bg-gray-50'}
                    ${isCurrentDay ? 'ring-2 ring-blue-500' : ''}
                    ${isWeekendDay ? 'bg-gray-50' : ''}
                  `}
                >
                  {date && (
                    <>
                      {/* Date number */}
                      <div className={`
                        text-sm font-medium mb-1
                        ${isCurrentDay ? 'text-blue-600' : 'text-gray-900'}
                        ${isWeekendDay ? 'text-gray-500' : ''}
                      `}>
                        {date.getDate()}
                      </div>

                      {/* Audit events */}
                      <div className="space-y-1">
                        {auditsForDate.slice(0, 3).map(audit => (
                          <div
                            key={audit.id}
                            onClick={() => onAuditSelect?.(audit)}
                            className={`
                              px-2 py-1 rounded text-xs cursor-pointer border-l-2
                              ${getTypeColor(audit.type)}
                              hover:shadow-sm transition-shadow
                            `}
                          >
                            <div className="font-medium truncate">{audit.title}</div>
                            <div className="text-gray-600 truncate">{audit.leadAuditor}</div>
                            <Badge className={`text-xs ${getStatusColor(audit.status)} mt-1`}>
                              {audit.status}
                            </Badge>
                          </div>
                        ))}
                        
                        {auditsForDate.length > 3 && (
                          <div className="text-xs text-gray-500 text-center py-1">
                            +{auditsForDate.length - 3} more
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Audit Types Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {auditTypes.map(type => (
              <div key={type} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded border-l-4 ${getTypeColor(type).split(' ')[1]}`}></div>
                <span className="text-sm">{type}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {audits.filter(a => a.status === 'PLANNED').length}
            </div>
            <div className="text-sm text-gray-600">Planned</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {audits.filter(a => a.status === 'IN_PROGRESS').length}
            </div>
            <div className="text-sm text-gray-600">In Progress</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {audits.filter(a => a.status === 'COMPLETED').length}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {audits.filter(a => {
                const today = new Date();
                const startDate = new Date(a.plannedStartDate);
                return a.status === 'PLANNED' && startDate < today;
              }).length}
            </div>
            <div className="text-sm text-gray-600">Overdue</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuditCalendar; 