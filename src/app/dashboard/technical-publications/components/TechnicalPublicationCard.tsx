'use client';

import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  Edit, 
  Trash2, 
  FileText, 
  Calendar, 
  User, 
  Hash 
} from 'lucide-react';
import { formatDateSafely } from '@/lib/utils';
import { TechnicalPublication } from '@/types/technical-publications';

interface TechnicalPublicationCardProps {
  publication: TechnicalPublication;
  onEdit: (publication: TechnicalPublication) => void;
  onDelete: (id: string) => void;
  onDownload: (fileKey: string, fileName: string) => void;
}

export function TechnicalPublicationCard({
  publication,
  onEdit,
  onDelete,
  onDownload
}: TechnicalPublicationCardProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-start gap-2">
          <FileText className="w-5 h-5 mt-0.5 text-blue-600 flex-shrink-0" />
          <span className="line-clamp-2">{publication.manualDescription}</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 space-y-3">
        <div className="flex items-center gap-2">
          <Hash className="w-4 h-4 text-gray-500" />
          <Badge variant="secondary">Rev {publication.revisionNumber}</Badge>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <User className="w-4 h-4" />
          <span>{publication.owner}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Calendar className="w-4 h-4" />
          <span>{formatDateSafely(publication.revisionDate, 'MMM dd, yyyy')}</span>
        </div>
        
        {publication.attachments && publication.attachments.length > 0 && (
          <div className="text-xs text-gray-500">
            File: {publication.attachments[0].fileName}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-3 flex gap-2">
        {publication.attachments && publication.attachments.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDownload(
              publication.attachments![0].fileKey,
              publication.attachments![0].fileName
            )}
            className="flex-1"
          >
            <Download className="w-4 h-4 mr-1" />
            Download
          </Button>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(publication)}
          className="px-2"
        >
          <Edit className="w-4 h-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(publication.id)}
          className="px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </CardFooter>
    </Card>
  );
} 