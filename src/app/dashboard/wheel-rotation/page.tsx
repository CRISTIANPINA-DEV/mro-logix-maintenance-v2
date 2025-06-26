"use client";

import React, { useState, useEffect } from "react";
import WheelRotationHeader from "./wheel-rotation-header";
import AddWheelForm from "./AddWheelForm";
import WheelRotationList from "./WheelRotationList";
import WheelDetailsModal from "./WheelDetailsModal";
import { Loader2 } from "lucide-react";

interface WheelRotation {
  id: string;
  arrivalDate: string;
  station: string;
  airline: string;
  wheelPartNumber: string;
  wheelSerialNumber: string;
  currentPosition: number;
  rotationFrequency: string;
  lastRotationDate: string | null;
  nextRotationDue: string | null;
  isActive: boolean;
  notes: string | null;
  rotationHistory: any[];
}

export default function WheelRotationPage() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [wheelRotations, setWheelRotations] = useState<WheelRotation[]>([]);
  const [selectedWheel, setSelectedWheel] = useState<WheelRotation | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch wheel rotations
  useEffect(() => {
    const fetchWheelRotations = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/wheel-rotation");
        if (response.ok) {
          const data = await response.json();
          setWheelRotations(data);
        }
      } catch (error) {
        console.error("Error fetching wheel rotations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWheelRotations();
  }, [refreshKey]);

  const handleAddWheel = () => {
    setShowAddForm(true);
  };

  const handleWheelClick = (wheel: WheelRotation) => {
    setSelectedWheel(wheel);
    setShowDetailsModal(true);
  };

  const handleFormClose = () => {
    setShowAddForm(false);
    setRefreshKey(prev => prev + 1);
  };

  const handleDetailsModalClose = () => {
    setShowDetailsModal(false);
    setSelectedWheel(null);
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen">
      <WheelRotationHeader 
        showForm={showAddForm}
        onAddWheelClick={handleAddWheel}
      />

      {showAddForm && (
        <AddWheelForm onClose={handleFormClose} />
      )}

      {!showAddForm && (
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <WheelRotationList 
              wheelRotations={wheelRotations}
              onWheelClick={handleWheelClick}
            />
          )}
        </div>
      )}

      {showDetailsModal && selectedWheel && (
        <WheelDetailsModal
          wheel={selectedWheel}
          isOpen={showDetailsModal}
          onClose={handleDetailsModalClose}
        />
      )}
    </div>
  );
} 