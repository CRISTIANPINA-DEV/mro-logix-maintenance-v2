"use client";

import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import Modal from 'react-modal';
import { 
  PlusIcon, 
  SearchIcon, 
  MessageSquareIcon, 
  EyeIcon, 
  ThumbsUpIcon,
  ClockIcon,
  UserIcon,
  FilterIcon,
  RefreshCwIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  CircleIcon,
  ReplyIcon,
  X
} from "lucide-react";
import Link from "next/link";
import { VotingButtons } from "@/components/voting-buttons";
import TechnicalQueriesHeader from "./technical-queries-header";

interface TechnicalQuery {
  id: string;
  title: string;
  description: string;
  category: string | null;
  priority: string;
  status: string;
  tags: string[];
  isResolved: boolean;
  viewCount: number;
  upvotes: number;
  downvotes: number;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
  };
  _count: {
    responses: number;
    votes: number;
  };
}

interface PaginationData {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

const CATEGORIES = [
  'ATA-05 Inspections',
  'ATA-10 Parking, Mooring, etc',
  'ATA-11 Placards/Markings',
  'ATA-12 Servicing',
  'ATA-21 Air Conditioning',
  'ATA-22 Autoflight',
  'ATA-23 Communications',
  'ATA-24 Electrical',
  'ATA-25 Equip/Furnishing',
  'ATA-26 Fire Protection',
  'ATA-27 Flight Controls',
  'ATA-28 Fuel',
  'ATA-29 Hydraulic SYS',
  'ATA-30 Ice/Rain Prot',
  'ATA-31 Instruments',
  'ATA-32 Landing Gear',
  'ATA-33 Lights',
  'ATA-34 Navigation',
  'ATA-35 Oxygen',
  'ATA-36 Pneumatic',
  'ATA-38 Water/Waste',
  'ATA-45 Central Maint. SYS',
  'ATA-49 APU',
  'ATA-51 Standard Practices',
  'ATA-52 Doors',
  'ATA-53 Fuselage',
  'ATA-54 Nacelles/Pylons',
  'ATA-55 Stabilizers',
  'ATA-56 Windows',
  'ATA-57 Wings',
  'ATA-70 Standard Practice - Engine',
  'ATA-71 PowerPlant',
  'ATA-72 Engine',
  'ATA-73 Fuel Control',
  'ATA-73 Engine Fuel Control',
  'ATA-74 Ignition',
  'ATA-75 Engine Bleed',
  'Other'
];

const PRIORITIES = [
  { value: "LOW", label: "Low", color: "bg-green-100 text-green-800" },
  { value: "MEDIUM", label: "Medium", color: "bg-yellow-100 text-yellow-800" },
  { value: "HIGH", label: "High", color: "bg-orange-100 text-orange-800" },
  { value: "URGENT", label: "Urgent", color: "bg-red-100 text-red-800" }
];

const STATUSES = [
  { value: "OPEN", label: "Open", icon: CircleIcon, color: "text-blue-500" },
  { value: "IN_PROGRESS", label: "In Progress", icon: ClockIcon, color: "text-yellow-500" },
  { value: "RESOLVED", label: "Resolved", icon: CheckCircleIcon, color: "text-green-500" },
  { value: "CLOSED", label: "Closed", icon: AlertCircleIcon, color: "text-gray-500" }
];

export default function TechnicalQueriesPage() {
  const [queries, setQueries] = useState<TechnicalQuery[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Create query form state
  const [newQuery, setNewQuery] = useState({
    title: "",
    description: "",
    category: "",
    priority: "MEDIUM",
    tags: ""
  });
  const [customCategory, setCustomCategory] = useState("");
  const [creating, setCreating] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    // Set the app element for react-modal
    if (typeof window !== 'undefined') {
      const appElement = document.getElementById('__next') || document.body;
      Modal.setAppElement(appElement);
      
      // Add portal container for Select dropdowns
      let portalContainer = document.getElementById('select-portal');
      if (!portalContainer) {
        portalContainer = document.createElement('div');
        portalContainer.id = 'select-portal';
        portalContainer.style.position = 'fixed';
        portalContainer.style.top = '0';
        portalContainer.style.left = '0';
        portalContainer.style.width = '100%';
        portalContainer.style.height = '100%';
        portalContainer.style.pointerEvents = 'none';
        portalContainer.style.zIndex = '10001';
        document.body.appendChild(portalContainer);
      }

      // Add modal-specific portal container
      let modalPortalContainer = document.getElementById('modal-select-portal');
      if (!modalPortalContainer) {
        modalPortalContainer = document.createElement('div');
        modalPortalContainer.id = 'modal-select-portal';
        modalPortalContainer.style.position = 'fixed';
        modalPortalContainer.style.top = '0';
        modalPortalContainer.style.left = '0';
        modalPortalContainer.style.width = '100%';
        modalPortalContainer.style.height = '100%';
        modalPortalContainer.style.pointerEvents = 'none';
        modalPortalContainer.style.zIndex = '10002';
        document.body.appendChild(modalPortalContainer);
      }
    }

    // Cleanup function
    return () => {
      if (typeof window !== 'undefined') {
        const portalContainer = document.getElementById('select-portal');
        if (portalContainer) {
          portalContainer.remove();
        }
        const modalPortalContainer = document.getElementById('modal-select-portal');
        if (modalPortalContainer) {
          modalPortalContainer.remove();
        }
      }
    };
  }, []);

  const fetchQueries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(categoryFilter && { category: categoryFilter }),
        ...(statusFilter && { status: statusFilter }),
        ...(priorityFilter && { priority: priorityFilter })
      });

      const response = await fetch(`/api/technical-queries?${params}`);
      const data = await response.json();

      if (data.success) {
        setQueries(data.data.queries);
        setPagination(data.data.pagination);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to fetch technical queries",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching queries:', error);
      toast({
        title: "Error",
        description: "Failed to fetch technical queries",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchTerm, categoryFilter, statusFilter, priorityFilter, toast]);

  useEffect(() => {
    fetchQueries();
  }, [fetchQueries]);

  const handleCreateQuery = async () => {
    if (!newQuery.title.trim() || !newQuery.description.trim()) {
      toast({
        title: "Error",
        description: "Title and description are required",
        variant: "destructive"
      });
      return;
    }

    if (newQuery.category === "Other" && !customCategory.trim()) {
      toast({
        title: "Error",
        description: "Please enter a custom category or select a different category",
        variant: "destructive"
      });
      return;
    }

    setCreating(true);
    try {
      const tags = newQuery.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      // Determine the final category value
      const finalCategory = newQuery.category === "Other" 
        ? customCategory.trim() || null 
        : newQuery.category || null;

      const response = await fetch('/api/technical-queries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: newQuery.title,
          description: newQuery.description,
          category: finalCategory,
          priority: newQuery.priority,
          tags
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Technical query created successfully"
        });
        setShowCreateDialog(false);
        setNewQuery({
          title: "",
          description: "",
          category: "",
          priority: "MEDIUM",
          tags: ""
        });
        setCustomCategory("");
        fetchQueries();
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to create technical query",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error creating query:', error);
      toast({
        title: "Error",
        description: "Failed to create technical query",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchQueries();
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setCategoryFilter("");
    setStatusFilter("");
    setPriorityFilter("");
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = PRIORITIES.find(p => p.value === priority);
    return priorityConfig ? (
      <Badge className={priorityConfig.color}>
        {priorityConfig.label}
      </Badge>
    ) : (
      <Badge variant="secondary">{priority}</Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    const statusConfig = STATUSES.find(s => s.value === status);
    if (statusConfig) {
      const Icon = statusConfig.icon;
      return <Icon className={`h-4 w-4 ${statusConfig.color}`} />;
    }
    return <CircleIcon className="h-4 w-4 text-gray-500" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Custom styles for react-modal (matching create-audit-dialog)
  const customStyles = {
    overlay: {
      backgroundColor: 'rgba(0, 0, 0, 0.60)',
      backdropFilter: 'blur(2px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
    },
    content: {
      position: 'relative' as const,
      top: 'auto',
      left: 'auto',
      right: 'auto',
      bottom: 'auto',
      width: '100%',
      height: '100%',
      maxWidth: '90vw',
      maxHeight: '90vh',
      border: 'none',
      borderRadius: '0',
      padding: '0',
      overflow: 'hidden',
      background: 'white',
      boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
      margin: 'auto',
      zIndex: 10000,
    },
  };

  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <TechnicalQueriesHeader onQueryCreated={() => setShowCreateDialog(true)} />

      {/* Create Query Modal */}
      <Modal
        isOpen={showCreateDialog}
        onRequestClose={() => setShowCreateDialog(false)}
        style={customStyles}
        contentLabel="Create New Technical Query"
        closeTimeoutMS={200}
        shouldCloseOnOverlayClick={false}
        shouldCloseOnEsc={true}
        appElement={typeof window !== 'undefined' ? document.getElementById('__next') || document.body : undefined}
      >
        <div className="flex flex-col h-full bg-gray-50" style={{ zIndex: 10000 }}>
          {/* Header */}
          <div className="flex-shrink-0 bg-white border-b border-gray-200">
            <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 rounded-md flex-shrink-0">
                  <PlusIcon className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-base sm:text-lg font-semibold text-gray-900 truncate">Create New Technical Query</h1>
                  <p className="text-xs text-gray-500 hidden sm:block">Ask a technical question to get help from the community</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateDialog(false)}
                disabled={creating}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0 cursor-pointer flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4" style={{ zIndex: 10000 }}>
            <div className="max-w-2xl mx-auto space-y-3 sm:space-y-4">
              <div>
                <Label htmlFor="title" className="text-sm">Title *</Label>
                <Input
                  id="title"
                  placeholder="Brief description of your question"
                  value={newQuery.title}
                  onChange={(e) => setNewQuery(prev => ({ ...prev, title: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="description" className="text-sm">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Provide detailed information about your technical question..."
                  rows={4}
                  value={newQuery.description}
                  onChange={(e) => setNewQuery(prev => ({ ...prev, description: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="category" className="text-sm">Category</Label>
                  <Select value={newQuery.category} onValueChange={(value) => setNewQuery(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent 
                      className="z-[10002]" 
                      style={{ zIndex: 10002 }}
                      position="popper"
                      sideOffset={4}
                    >
                      {CATEGORIES.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {newQuery.category === "Other" && (
                    <div className="mt-2">
                      <Input
                        placeholder="Enter custom category"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                      />
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="priority" className="text-sm">Priority</Label>
                  <Select value={newQuery.priority} onValueChange={(value) => setNewQuery(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent 
                      className="z-[10002]" 
                      style={{ zIndex: 10002 }}
                      position="popper"
                      sideOffset={4}
                    >
                      {PRIORITIES.map(priority => (
                        <SelectItem key={priority.value} value={priority.value}>
                          {priority.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="tags" className="text-sm">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  placeholder="e.g., boeing-737, hydraulic-system, troubleshooting"
                  value={newQuery.tags}
                  onChange={(e) => setNewQuery(prev => ({ ...prev, tags: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 bg-white border-t border-gray-200 px-3 sm:px-4 py-2 sm:py-3">
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                disabled={creating}
                className="cursor-pointer text-sm"
              >
                Cancel
              </Button>
              <Button onClick={handleCreateQuery} disabled={creating} className="cursor-pointer text-sm">
                {creating ? "Creating..." : "Create Query"}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Search queries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="text-sm"
              />
              <Button onClick={handleSearch} size="sm" className="flex-shrink-0">
                <SearchIcon className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                size="sm"
                className="flex items-center gap-2"
              >
                <FilterIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Filters</span>
              </Button>
              <Button
                variant="outline"
                onClick={fetchQueries}
                disabled={loading}
                size="sm"
                className="flex-shrink-0"
              >
                <RefreshCwIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
          
          {showFilters && (
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <Label className="text-sm">Category</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All categories</SelectItem>
                    {CATEGORIES.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All statuses</SelectItem>
                    {STATUSES.map(status => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm">Priority</Label>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="All priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All priorities</SelectItem>
                    {PRIORITIES.map(priority => (
                      <SelectItem key={priority.value} value={priority.value}>
                        {priority.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-3">
                <Button variant="neutral" onClick={handleClearFilters} size="sm">
                  Clear Filters
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Queries List */}
      <div className="space-y-3 sm:space-y-4">
        {loading ? (
          <div className="text-center py-6 sm:py-8">
            <RefreshCwIcon className="h-6 w-6 sm:h-8 sm:w-8 animate-spin mx-auto mb-2" />
            <p className="text-sm sm:text-base">Loading technical queries...</p>
          </div>
        ) : queries.length === 0 ? (
          <Card>
            <CardContent className="text-center py-6 sm:py-8">
              <MessageSquareIcon className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-muted-foreground" />
              <h3 className="text-base sm:text-lg font-semibold mb-2">No queries found</h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
                {searchTerm || categoryFilter || statusFilter || priorityFilter
                  ? "Try adjusting your search criteria"
                  : "Be the first to ask a technical question!"
                }
              </p>
              {!searchTerm && !categoryFilter && !statusFilter && !priorityFilter && (
                <Button variant="neutral" onClick={() => setShowCreateDialog(true)} size="sm">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create First Query
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          queries.map((query) => (
            <Card key={query.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-2">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <div className="flex-shrink-0 mt-0.5">
                      {getStatusIcon(query.status)}
                    </div>
                    <Link 
                      href={`/dashboard/technical-queries/${query.id}`}
                      className="text-sm sm:text-base font-semibold hover:text-primary transition-colors line-clamp-2 sm:line-clamp-1"
                    >
                      {query.title}
                    </Link>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 self-start">
                    {getPriorityBadge(query.priority)}
                    {query.isResolved && (
                      <Badge className="bg-green-100 text-green-800 text-xs">
                        <CheckCircleIcon className="h-3 w-3 mr-1" />
                        <span className="hidden sm:inline">Resolved</span>
                        <span className="sm:hidden">✓</span>
                      </Badge>
                    )}
                  </div>
                </div>
                
                <p className="text-muted-foreground mb-2 sm:mb-3 line-clamp-2 text-xs sm:text-sm">
                  {query.description}
                </p>
                
                <div className="flex flex-wrap gap-1 mb-2 sm:mb-3">
                  {query.category && (
                    <Badge variant="outline" className="text-xs py-0 px-1.5">{query.category}</Badge>
                  )}
                  {query.tags.slice(0, 2).map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs py-0 px-1.5">
                      {tag}
                    </Badge>
                  ))}
                  {query.tags.length > 2 && (
                    <Badge variant="secondary" className="text-xs py-0 px-1.5">
                      +{query.tags.length - 2}
                    </Badge>
                  )}
                </div>
                
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <div className="flex items-center gap-1">
                      <UserIcon className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate max-w-20 sm:max-w-24">
                        {query.createdBy.firstName} {query.createdBy.lastName}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquareIcon className="h-3 w-3" />
                      <span>{query._count.responses}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <EyeIcon className="h-3 w-3" />
                      <span>{query.viewCount}</span>
                    </div>
                    <VotingButtons
                      itemId={query.id}
                      itemType="query"
                      initialUpvotes={query.upvotes}
                      initialDownvotes={query.downvotes}
                      size="sm"
                    />
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <ClockIcon className="h-3 w-3" />
                    <span className="text-xs">
                      {new Date(query.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4">
          <Button
            variant="neutral"
            disabled={pagination.page === 1}
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            size="sm"
            className="w-full sm:w-auto"
          >
            Previous
          </Button>
          <span className="flex items-center px-2 sm:px-4 text-sm">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="neutral"
            disabled={pagination.page === pagination.totalPages}
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            size="sm"
            className="w-full sm:w-auto"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
} 