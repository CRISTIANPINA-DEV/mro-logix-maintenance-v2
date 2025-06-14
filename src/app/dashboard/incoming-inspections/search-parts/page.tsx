"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft } from "lucide-react";

interface StockInventoryItem {
  id: string;
  partNo: string;
  serialNo: string;
  description: string;
  incomingDate: string;
  station: string;
  customStation: string | null;
  owner: string;
  customOwner: string | null;
  quantity: string;
  hasExpireDate: boolean;
  expireDate: string | null;
  type: string;
  customType: string | null;
  location: string;
  customLocation: string | null;
  hasInspection: boolean;
  inspectionResult: string | null;
  inspectionFailure: string | null;
  customFailure: string | null;
  hasComment: boolean;
  comment: string | null;
}

interface SearchFilters {
  partNo: string;
  serialNo: string;
  description: string;
  location: string;
  type: string;
  station: string;
  owner: string;
  hasExpireDate: boolean;
  hasInspection: boolean;
  inspectionResult: string | null;
}

export default function SearchPartsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [searchResults, setSearchResults] = useState<StockInventoryItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    partNo: '',
    serialNo: '',
    description: '',
    location: '',
    type: '',
    station: '',
    owner: '',
    hasExpireDate: false,
    hasInspection: false,
    inspectionResult: null,
  });

  // Search for stock inventory items
  useEffect(() => {
    const searchItems = async () => {
      const hasActiveFilters = Object.values(searchFilters).some(value => 
        value !== '' && value !== null && value !== false
      );

      if (!hasActiveFilters) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const queryParams = new URLSearchParams();
        Object.entries(searchFilters).forEach(([key, value]) => {
          if (value !== '' && value !== null && value !== false) {
            queryParams.append(key, value.toString());
          }
        });

        const response = await fetch(`/api/stock-inventory/search?${queryParams.toString()}`);
        const data = await response.json();
        
        if (data.success) {
          setSearchResults(data.data);
        } else {
          console.error('Search failed:', data.error);
          toast({
            title: "Error",
            description: "Failed to search stock inventory items",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error searching stock inventory:', error);
        toast({
          title: "Error",
          description: "Failed to search stock inventory items",
          variant: "destructive",
        });
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchItems, 500);
    return () => clearTimeout(debounceTimer);
  }, [searchFilters, toast]);

  const handleSelectPart = (item: StockInventoryItem) => {
    // Store the selected part in localStorage
    localStorage.setItem('selectedPart', JSON.stringify(item));
    // Navigate directly to the inspection form page
    router.push('/dashboard/incoming-inspections?showForm=true');
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Inspection Form
        </Button>
        <h1 className="text-2xl font-semibold">Search Parts</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Part Number</Label>
              <Input
                placeholder="Enter part number"
                value={searchFilters.partNo}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, partNo: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Serial Number</Label>
              <Input
                placeholder="Enter serial number"
                value={searchFilters.serialNo}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, serialNo: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                placeholder="Enter description"
                value={searchFilters.description}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                placeholder="Enter location"
                value={searchFilters.location}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, location: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Input
                placeholder="Enter type"
                value={searchFilters.type}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, type: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Station</Label>
              <Input
                placeholder="Enter station"
                value={searchFilters.station}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, station: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Owner</Label>
              <Input
                placeholder="Enter owner"
                value={searchFilters.owner}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, owner: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Inspection Result</Label>
              <Select
                value={searchFilters.inspectionResult || 'ANY'}
                onValueChange={(value) => setSearchFilters(prev => ({ ...prev, inspectionResult: value === 'ANY' ? null : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select result" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ANY">Any</SelectItem>
                  <SelectItem value="PASS">Pass</SelectItem>
                  <SelectItem value="FAIL">Fail</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 flex gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasExpireDate"
                  checked={searchFilters.hasExpireDate}
                  onCheckedChange={(checked) => 
                    setSearchFilters(prev => ({ ...prev, hasExpireDate: checked as boolean }))
                  }
                />
                <Label htmlFor="hasExpireDate">Has Expiration Date</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasInspection"
                  checked={searchFilters.hasInspection}
                  onCheckedChange={(checked) => 
                    setSearchFilters(prev => ({ ...prev, hasInspection: checked as boolean }))
                  }
                />
                <Label htmlFor="hasInspection">Has Inspection</Label>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="space-y-2">
            <Label>Search Results</Label>
            <div className="max-h-[600px] overflow-y-auto border rounded-md">
              {isSearching ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                  Searching...
                </div>
              ) : searchResults.length === 0 ? (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  No parts found matching your criteria
                </div>
              ) : (
                <div className="divide-y">
                  {searchResults.map((item) => (
                    <button
                      key={item.id}
                      className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                      onClick={() => handleSelectPart(item)}
                    >
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{item.partNo}</span>
                          <span className="text-xs text-muted-foreground">
                            Qty: {item.quantity}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-0.5">
                          {item.serialNo && <div>S/N: {item.serialNo}</div>}
                          <div className="truncate">{item.description}</div>
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                              {item.customLocation || item.location}
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-green-100 text-green-800">
                              {item.customType || item.type}
                            </span>
                            {item.hasExpireDate && item.expireDate && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded bg-yellow-100 text-yellow-800">
                                Exp: {new Date(item.expireDate).toLocaleDateString()}
                              </span>
                            )}
                            {item.hasInspection && item.inspectionResult && (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded ${
                                item.inspectionResult === 'PASS' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {item.inspectionResult}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 