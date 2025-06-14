"use client";

import { useState } from "react";
import { AddStockInventoryForm } from "./AddStockInventoryForm";
import { StockInventoryList } from "./StockInventoryList";
import { Input } from "@/components/ui/input";
import StockInventoryHeader from './stock-inventory-header';
import { useIsTabletLandscape } from "@/hooks/use-tablet-landscape";

export default function StockInventoryPage() {
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const isTabletLandscape = useIsTabletLandscape();

  return (
    <div className="container mx-auto p-4 space-y-6">
      <StockInventoryHeader showForm={showForm} onAddStockClick={() => setShowForm(true)} />
      
      {/* Limited view indicator for tablet landscape */}
      {!showForm && isTabletLandscape && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
          <p className="font-medium">
            You&apos;re viewing a simplified layout optimized for tablets. For all details, tap any item or switch to desktop view.
          </p>
        </div>
      )}

      {showForm && (
        <AddStockInventoryForm onClose={() => setShowForm(false)} />
      )}

      {!showForm && (
        <div className="mb-4">
          <Input
            type="search"
            placeholder="Search stock inventory..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-1/2 lg:w-1/3"
          />
        </div>
      )}

      {!showForm && <StockInventoryList searchTerm={searchTerm} />}
    </div>
  );
}
