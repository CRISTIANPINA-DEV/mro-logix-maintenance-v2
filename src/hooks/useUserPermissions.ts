"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export type UserPermissions = {
  canViewFlightRecords: boolean;
  canAddFlightRecords: boolean;
  canExportFlightRecords: boolean;
  canEditFlightRecords: boolean;
  canExportPdfFlightRecords: boolean;
  canDeleteFlightRecords: boolean;
  canViewStockInventory: boolean;
  canGenerateStockReport: boolean;
  canAddStockItem: boolean;
  canGenerateStockPdf: boolean;
  canDeleteStockRecord: boolean;
  canViewIncomingInspections: boolean;
  canAddIncomingInspections: boolean;
  canDeleteIncomingInspections: boolean;
  canConfigureTemperatureRanges: boolean;
  canAddTemperatureRecord: boolean;
  canDeleteTemperatureRecord: boolean;
  canSeeAuditManagement: boolean;
};

export function useUserPermissions() {
  const { data: session } = useSession();
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.id) {
      // If admin, always grant all permissions
      if (session.user.privilege === 'admin') {
        setPermissions({
          canViewFlightRecords: true,
          canAddFlightRecords: true,
          canExportFlightRecords: true,
          canEditFlightRecords: true,
          canExportPdfFlightRecords: true,
          canDeleteFlightRecords: true,
          canViewStockInventory: true,
          canGenerateStockReport: true,
          canAddStockItem: true,
          canGenerateStockPdf: true,
          canDeleteStockRecord: true,
          canViewIncomingInspections: true,
          canAddIncomingInspections: true,
          canDeleteIncomingInspections: true,
          canConfigureTemperatureRanges: true,
          canAddTemperatureRecord: true,
          canDeleteTemperatureRecord: true,
          canSeeAuditManagement: true,
        });
        setLoading(false);
        return;
      }
      fetchUserPermissions();
    } else {
      setLoading(false);
    }
  }, [session?.user?.id, session?.user?.privilege]);

  const fetchUserPermissions = async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch(`/api/users/permissions?userId=${session.user.id}`);
      const data = await response.json();

      if (response.ok) {
        setPermissions(data.permissions);
      } else if (response.status === 401 || response.status === 403) {
        setPermissions({
          canViewFlightRecords: false,
          canAddFlightRecords: false,
          canExportFlightRecords: false,
          canEditFlightRecords: false,
          canExportPdfFlightRecords: false,
          canDeleteFlightRecords: false,
          canViewStockInventory: false,
          canGenerateStockReport: false,
          canAddStockItem: false,
          canGenerateStockPdf: false,
          canDeleteStockRecord: false,
          canViewIncomingInspections: false,
          canAddIncomingInspections: false,
          canDeleteIncomingInspections: false,
          canConfigureTemperatureRanges: false,
          canAddTemperatureRecord: false,
          canDeleteTemperatureRecord: false,
          canSeeAuditManagement: false,
        });
      } else {
        // Set default permissions if API fails for other reasons
        setPermissions({
          canViewFlightRecords: true,
          canAddFlightRecords: true,
          canExportFlightRecords: false,
          canEditFlightRecords: false,
          canExportPdfFlightRecords: false,
          canDeleteFlightRecords: false,
          canViewStockInventory: false,
          canGenerateStockReport: true,
          canAddStockItem: false,
          canGenerateStockPdf: true,
          canDeleteStockRecord: false,
          canViewIncomingInspections: true,
          canAddIncomingInspections: false,
          canDeleteIncomingInspections: false,
          canConfigureTemperatureRanges: false,
          canAddTemperatureRecord: false,
          canDeleteTemperatureRecord: false,
          canSeeAuditManagement: false,
        });
      }
    } catch (error) {
      console.error("Error fetching user permissions:", error);
      // Set default permissions on error
      setPermissions({
        canViewFlightRecords: true,
        canAddFlightRecords: true,
        canExportFlightRecords: false,
        canEditFlightRecords: false,
        canExportPdfFlightRecords: false,
        canDeleteFlightRecords: false,
        canViewStockInventory: false,
        canGenerateStockReport: true,
        canAddStockItem: false,
        canGenerateStockPdf: true,
        canDeleteStockRecord: false,
        canViewIncomingInspections: true,
        canAddIncomingInspections: false,
        canDeleteIncomingInspections: false,
        canConfigureTemperatureRanges: false,
        canAddTemperatureRecord: false,
        canDeleteTemperatureRecord: false,
        canSeeAuditManagement: false,
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    permissions,
    loading,
    refetch: fetchUserPermissions,
  };
} 