'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Users, Calendar } from 'lucide-react';
import { TechnicalPublication } from '@/types/technical-publications';

interface TechnicalPublicationsHeaderProps {
  publications: TechnicalPublication[];
  onAddNew: () => void;
}

export function TechnicalPublicationsHeader({
  publications,
  onAddNew
}: TechnicalPublicationsHeaderProps) {
  // Calculate stats
  const totalPublications = publications.length;
  const uniqueOwners = new Set(publications.map(p => p.owner)).size;
  const recentPublications = publications.filter(p => {
    const publicationDate = new Date(p.revisionDate);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return publicationDate >= thirtyDaysAgo;
  }).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Technical Publications
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage company manuals, revisions, and documentation
          </p>
        </div>
        <Button onClick={onAddNew} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Add Publication
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Publications</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalPublications}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Document Owners</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{uniqueOwners}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Recent (30 days)</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{recentPublications}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 