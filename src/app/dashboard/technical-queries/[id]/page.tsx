"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeftIcon,
  MessageSquareIcon, 
  EyeIcon, 
  ThumbsUpIcon,
  ClockIcon,
  UserIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  CircleIcon,
  TrashIcon,
  EditIcon,
  SendIcon,
  AlertTriangleIcon,
  ReplyIcon
} from "lucide-react";
import Link from "next/link";
import { VotingButtons } from "@/components/voting-buttons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  responses: TechnicalQueryResponse[];
  _count: {
    responses: number;
    votes: number;
  };
}

interface TechnicalQueryResponse {
  id: string;
  content: string;
  isAcceptedAnswer: boolean;
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
    votes: number;
  };
}

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

export default function TechnicalQueryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [query, setQuery] = useState<TechnicalQuery | null>(null);
  const [loading, setLoading] = useState(true);
  const [responseContent, setResponseContent] = useState("");
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  useEffect(() => {
    fetchQuery();
    fetchCurrentUser();
  }, [params.id]);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/check');
      if (response.ok) {
        const data = await response.json();
        setCurrentUserId(data.user?.id || null);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchQuery = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/technical-queries/${params.id}`);
      const data = await response.json();

      if (data.success) {
        setQuery(data.data);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to fetch technical query",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching query:', error);
      toast({
        title: "Error",
        description: "Failed to fetch technical query",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitResponse = async () => {
    if (!responseContent.trim()) {
      toast({
        title: "Error",
        description: "Response content is required",
        variant: "destructive"
      });
      return;
    }

    setSubmittingResponse(true);
    try {
      const response = await fetch(`/api/technical-queries/${params.id}/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: responseContent
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Response submitted successfully"
        });
        setResponseContent("");
        setShowResponseForm(false); // Hide form after successful submission
        fetchQuery(); // Refresh to show new response
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to submit response",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      toast({
        title: "Error",
        description: "Failed to submit response",
        variant: "destructive"
      });
    } finally {
      setSubmittingResponse(false);
    }
  };

  const handleDeleteQuery = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/technical-queries/${params.id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Technical query deleted successfully"
        });
        // Close dialog and reset state
        setShowDeleteDialog(false);
        setDeleteConfirmText("");
        router.push('/dashboard/technical-queries');
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to delete technical query",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error deleting query:', error);
      toast({
        title: "Error",
        description: "Failed to delete technical query",
        variant: "destructive"
      });
    } finally {
      setDeleting(false);
    }
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

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
          <p>Loading technical query...</p>
        </div>
      </div>
    );
  }

  if (!query) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="text-center py-8">
            <AlertTriangleIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Query not found</h3>
            <p className="text-muted-foreground mb-4">
              The technical query you're looking for doesn't exist or has been deleted.
            </p>
            <Button asChild>
              <Link href="/dashboard/technical-queries">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Queries
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canDeleteQuery = currentUserId === query.createdBy.id;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="neutral" asChild>
          <Link href="/dashboard/technical-queries">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Queries
          </Link>
        </Button>
        {canDeleteQuery && (
          <>
            <Button 
              variant="delete" 
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Delete Query
            </Button>
            
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-destructive">Delete Technical Query</DialogTitle>
                  <DialogDescription>
                    This action cannot be undone. This will permanently delete the technical query
                    and all its responses.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <p className="text-sm font-medium">
                    Please type "Delete" to confirm:
                  </p>
                  <Input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Type 'Delete' to confirm"
                    className="w-full"
                  />
                </div>
                <DialogFooter>
                  <Button
                    variant="neutral"
                    onClick={() => {
                      setShowDeleteDialog(false);
                      setDeleteConfirmText("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="delete"
                    onClick={handleDeleteQuery}
                    disabled={deleteConfirmText !== "Delete" || deleting}
                  >
                    {deleting ? "Deleting..." : "Delete Query"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>

      {/* Query Details */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              {getStatusIcon(query.status)}
              <CardTitle className="text-2xl">{query.title}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {getPriorityBadge(query.priority)}
              {query.isResolved && (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircleIcon className="h-3 w-3 mr-1" />
                  Resolved
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="prose max-w-none">
            <p className="text-base leading-relaxed whitespace-pre-wrap">
              {query.description}
            </p>
          </div>
          
          {/* Tags and Category */}
          <div className="flex flex-wrap gap-2">
            {query.category && (
              <Badge variant="outline">{query.category}</Badge>
            )}
            {query.tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
          
          {/* Query Meta */}
          <div className="flex justify-between items-center text-sm text-muted-foreground pt-4 border-t">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">
                    {getInitials(query.createdBy.firstName, query.createdBy.lastName)}
                  </AvatarFallback>
                </Avatar>
                <span>
                  {query.createdBy.firstName} {query.createdBy.lastName}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <MessageSquareIcon className="h-4 w-4" />
                {query._count.responses} responses
              </div>
              <div className="flex items-center gap-1">
                <EyeIcon className="h-4 w-4" />
                {query.viewCount} views
              </div>
              <VotingButtons
                itemId={query.id}
                itemType="query"
                initialUpvotes={query.upvotes}
                initialDownvotes={query.downvotes}
                size="md"
              />
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="neutral"
                size="sm"
                onClick={() => setShowResponseForm(!showResponseForm)}
                className="flex items-center gap-2"
              >
                <ReplyIcon className="h-4 w-4" />
                {showResponseForm ? "Cancel" : "Add Response"}
              </Button>
              <div className="flex items-center gap-1">
                <ClockIcon className="h-4 w-4" />
                {formatDate(query.createdAt)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Responses Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquareIcon className="h-5 w-5" />
            Responses ({query.responses.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add Response Form - Conditionally Rendered */}
          {showResponseForm && (
            <>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Add Your Response</h3>
                <Textarea
                  placeholder="Share your knowledge and help solve this technical question..."
                  rows={4}
                  value={responseContent}
                  onChange={(e) => setResponseContent(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button 
                    variant="save"
                    onClick={handleSubmitResponse} 
                    disabled={submittingResponse || !responseContent.trim()}
                    className="flex items-center gap-2"
                  >
                    <SendIcon className="h-4 w-4" />
                    {submittingResponse ? "Submitting..." : "Submit Response"}
                  </Button>
                  <Button 
                    variant="neutral"
                    onClick={() => {
                      setShowResponseForm(false);
                      setResponseContent("");
                    }}
                    disabled={submittingResponse}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Responses List */}
          {query.responses.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquareIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No responses yet</h3>
              <p className="text-muted-foreground">
                Be the first to help solve this technical question!
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {query.responses.map((response, index) => (
                <div key={response.id} className="space-y-3">
                  {response.isAcceptedAnswer && (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircleIcon className="h-3 w-3 mr-1" />
                      Accepted Answer
                    </Badge>
                  )}
                  <div className="prose max-w-none">
                    <p className="text-base leading-relaxed whitespace-pre-wrap">
                      {response.content}
                    </p>
                  </div>
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {getInitials(response.createdBy.firstName, response.createdBy.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <span>
                          {response.createdBy.firstName} {response.createdBy.lastName}
                        </span>
                      </div>
                      <VotingButtons
                        itemId={response.id}
                        itemType="response"
                        queryId={query.id}
                        initialUpvotes={response.upvotes}
                        initialDownvotes={response.downvotes}
                        size="sm"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <ClockIcon className="h-4 w-4" />
                      {formatDate(response.createdAt)}
                    </div>
                  </div>
                  {index < query.responses.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 