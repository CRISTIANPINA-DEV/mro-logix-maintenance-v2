"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { ThumbsUpIcon, ThumbsDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface VotingButtonsProps {
  itemId: string;
  itemType: "query" | "response";
  queryId?: string; // Required when itemType is "response"
  initialUpvotes: number;
  initialDownvotes: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function VotingButtons({
  itemId,
  itemType,
  queryId,
  initialUpvotes,
  initialDownvotes,
  size = "sm",
  className
}: VotingButtonsProps) {
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [downvotes, setDownvotes] = useState(initialDownvotes);
  const [userVote, setUserVote] = useState<"UP" | "DOWN" | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Fetch user's current vote status
  useEffect(() => {
    fetchUserVote();
  }, [itemId, itemType]);

  const fetchUserVote = async () => {
    try {
      const url = itemType === "query" 
        ? `/api/technical-queries/${itemId}/vote`
        : `/api/technical-queries/${queryId}/responses/${itemId}/vote`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setUserVote(data.data.userVote);
      }
    } catch (error) {
      console.error('Error fetching user vote:', error);
    }
  };

  const handleVote = async (voteType: "UP" | "DOWN") => {
    setLoading(true);
    try {
      const url = itemType === "query" 
        ? `/api/technical-queries/${itemId}/vote`
        : `/api/technical-queries/${queryId}/responses/${itemId}/vote`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ voteType })
      });

      const data = await response.json();

      if (data.success) {
        setUpvotes(data.data.upvotes);
        setDownvotes(data.data.downvotes);
        setUserVote(data.data.userVote);
        
        // Optional: Show success message
        // toast({
        //   title: "Vote recorded",
        //   description: data.message
        // });
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to record vote",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error voting:', error);
      toast({
        title: "Error",
        description: "Failed to record vote",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const buttonSizes = {
    sm: "h-6 w-6 p-1",
    md: "h-8 w-8 p-1.5",
    lg: "h-10 w-10 p-2"
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {/* Upvote Button */}
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          buttonSizes[size],
          userVote === "UP" 
            ? "text-green-600 bg-green-50 hover:bg-green-100" 
            : "text-muted-foreground hover:text-green-600"
        )}
        onClick={() => handleVote("UP")}
        disabled={loading}
      >
        <ThumbsUpIcon className={iconSizes[size]} />
      </Button>
      
      {/* Upvote Count */}
      <span className={cn(textSizes[size], "text-muted-foreground min-w-[1rem] text-center")}>
        {upvotes}
      </span>
      
      {/* Downvote Button */}
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          buttonSizes[size],
          userVote === "DOWN" 
            ? "text-red-600 bg-red-50 hover:bg-red-100" 
            : "text-muted-foreground hover:text-red-600"
        )}
        onClick={() => handleVote("DOWN")}
        disabled={loading}
      >
        <ThumbsDownIcon className={iconSizes[size]} />
      </Button>
      
      {/* Downvote Count */}
      <span className={cn(textSizes[size], "text-muted-foreground min-w-[1rem] text-center")}>
        {downvotes}
      </span>
    </div>
  );
} 