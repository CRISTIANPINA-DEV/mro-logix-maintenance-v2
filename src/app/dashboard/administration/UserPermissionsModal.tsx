"use client";

import { useState, useEffect } from "react";
import Modal from "react-modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Plane, X, Package, ClipboardCheck, ThermometerSnowflake } from "lucide-react";
import { cn } from "@/lib/utils";

// Configure react-modal
Modal.setAppElement("#app-root");

type UserPermissions = {
  id: string;
  userId: string;
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
  createdAt: Date;
  updatedAt: Date;
};

type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onPermissionsChanged?: () => void;
};

export function UserPermissionsModal({ isOpen, onClose, user, onPermissionsChanged }: Props) {
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen && user) {
      fetchUserPermissions();
    }
  }, [isOpen, user]);

  const fetchUserPermissions = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/users/permissions?userId=${user.id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch permissions");
      }

      setPermissions(data.permissions);
    } catch (error) {
      console.error("Error fetching permissions:", error);
      toast.error("Failed to load user permissions");
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handlePermissionChange = async (permission: string, value: boolean) => {
    if (!permissions || !user) return;

    setSaving(true);
    try {
      const updatedPermissions = {
        ...permissions,
        [permission]: value,
      };

      const response = await fetch("/api/users/permissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          canViewFlightRecords: updatedPermissions.canViewFlightRecords,
          canAddFlightRecords: updatedPermissions.canAddFlightRecords,
          canExportFlightRecords: updatedPermissions.canExportFlightRecords,
          canEditFlightRecords: updatedPermissions.canEditFlightRecords,
          canExportPdfFlightRecords: updatedPermissions.canExportPdfFlightRecords,
          canDeleteFlightRecords: updatedPermissions.canDeleteFlightRecords,
          canViewStockInventory: updatedPermissions.canViewStockInventory,
          canGenerateStockReport: updatedPermissions.canGenerateStockReport,
          canAddStockItem: updatedPermissions.canAddStockItem,
          canGenerateStockPdf: updatedPermissions.canGenerateStockPdf,
          canDeleteStockRecord: updatedPermissions.canDeleteStockRecord,
          canViewIncomingInspections: updatedPermissions.canViewIncomingInspections,
          canAddIncomingInspections: updatedPermissions.canAddIncomingInspections,
          canDeleteIncomingInspections: updatedPermissions.canDeleteIncomingInspections,
          canConfigureTemperatureRanges: updatedPermissions.canConfigureTemperatureRanges,
          canAddTemperatureRecord: updatedPermissions.canAddTemperatureRecord,
          canDeleteTemperatureRecord: updatedPermissions.canDeleteTemperatureRecord,
          canSeeAuditManagement: updatedPermissions.canSeeAuditManagement,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update permissions");
      }

      setPermissions(updatedPermissions);
      toast.success("Permissions updated successfully");
      onPermissionsChanged?.();
    } catch (error) {
      console.error("Error updating permissions:", error);
      toast.error("Failed to update permissions");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="w-full max-w-[1000px] max-h-[90vh] overflow-y-auto bg-background border shadow-lg mx-auto mt-20 outline-none"
      overlayClassName="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4"
      contentLabel="User Permissions Modal"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">User Permissions</h2>
            <p className="text-sm text-muted-foreground">
              Manage permissions for {user.firstName} {user.lastName} ({user.email})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted/50 rounded-sm transition-colors"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">Loading permissions...</div>
            </div>
          ) : permissions ? (
            <div className="space-y-4">
              {/* Flight Records Section */}
              <div className="border">
                <button
                  onClick={() => toggleSection('flight-records')}
                  className="w-full flex items-center justify-between p-2 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 w-full">
                    <Plane className="h-5 w-5 text-blue-500" />
                    <div className="flex flex-row items-center gap-2 w-full">
                      <h3 className="font-medium whitespace-nowrap">Flight Records</h3>
                      <span className="text-sm text-muted-foreground truncate">Control access to flight records functionality</span>
                    </div>
                  </div>
                  {expandedSections.has('flight-records') ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>

                {expandedSections.has('flight-records') && (
                  <div className="border-t p-2 space-y-2">
                    {/* View Page Permission */}
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium">View Page</label>
                        <p className="text-xs text-muted-foreground">
                          Allow user to access the Flight Records page
                        </p>
                      </div>
                      <Select
                        value={permissions.canViewFlightRecords ? "YES" : "NO"}
                        onValueChange={(value) => 
                          handlePermissionChange("canViewFlightRecords", value === "YES")
                        }
                        disabled={saving}
                      >
                        <SelectTrigger className="w-16 h-7 text-xs rounded-none border border-input">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="YES">YES</SelectItem>
                          <SelectItem value="NO">NO</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Add Flight Button Permission */}
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium">Add Flight Button</label>
                        <p className="text-xs text-muted-foreground">
                          Allow user to see and use the Add Flight button
                        </p>
                      </div>
                      <Select
                        value={permissions.canAddFlightRecords ? "YES" : "NO"}
                        onValueChange={(value) => 
                          handlePermissionChange("canAddFlightRecords", value === "YES")
                        }
                        disabled={saving}
                      >
                        <SelectTrigger className="w-16 h-7 text-xs rounded-none border border-input">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="YES">YES</SelectItem>
                          <SelectItem value="NO">NO</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Export Data Button Permission */}
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium">Export Data Button</label>
                        <p className="text-xs text-muted-foreground">
                          Allow user to see and use the Export Data button
                        </p>
                      </div>
                      <Select
                        value={permissions.canExportFlightRecords ? "YES" : "NO"}
                        onValueChange={(value) => 
                          handlePermissionChange("canExportFlightRecords", value === "YES")
                        }
                        disabled={saving}
                      >
                        <SelectTrigger className="w-16 h-7 text-xs rounded-none border border-input">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="YES">YES</SelectItem>
                          <SelectItem value="NO">NO</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Edit Button Permission */}
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium">Edit Button</label>
                        <p className="text-xs text-muted-foreground">
                          Allow user to see and use the Edit button in Flight Records Report
                        </p>
                      </div>
                      <Select
                        value={permissions.canEditFlightRecords ? "YES" : "NO"}
                        onValueChange={(value) => 
                          handlePermissionChange("canEditFlightRecords", value === "YES")
                        }
                        disabled={saving}
                      >
                        <SelectTrigger className="w-16 h-7 text-xs rounded-none border border-input">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="YES">YES</SelectItem>
                          <SelectItem value="NO">NO</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Export PDF Button Permission */}
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium">Export PDF Button</label>
                        <p className="text-xs text-muted-foreground">
                          Allow user to see and use the Export PDF button in Flight Records Report
                        </p>
                      </div>
                      <Select
                        value={permissions.canExportPdfFlightRecords ? "YES" : "NO"}
                        onValueChange={(value) => 
                          handlePermissionChange("canExportPdfFlightRecords", value === "YES")
                        }
                        disabled={saving}
                      >
                        <SelectTrigger className="w-16 h-7 text-xs rounded-none border border-input">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="YES">YES</SelectItem>
                          <SelectItem value="NO">NO</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Delete Button Permission */}
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium">Delete Button</label>
                        <p className="text-xs text-muted-foreground">
                          Allow user to see and use the Delete button in Flight Records Report
                        </p>
                      </div>
                      <Select
                        value={permissions.canDeleteFlightRecords ? "YES" : "NO"}
                        onValueChange={(value) => 
                          handlePermissionChange("canDeleteFlightRecords", value === "YES")
                        }
                        disabled={saving}
                      >
                        <SelectTrigger className="w-16 h-7 text-xs rounded-none border border-input">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="YES">YES</SelectItem>
                          <SelectItem value="NO">NO</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>

              {/* Stock Inventory Section */}
              <div className="border">
                <button
                  onClick={() => toggleSection('stock-inventory')}
                  className="w-full flex items-center justify-between p-2 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 w-full">
                    <Package className="h-5 w-5 text-blue-500" />
                    <div className="flex flex-row items-center gap-2 w-full">
                      <h3 className="font-medium whitespace-nowrap">Stock Inventory</h3>
                      <span className="text-sm text-muted-foreground truncate">Control access to stock inventory functionality</span>
                    </div>
                  </div>
                  {expandedSections.has('stock-inventory') ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>

                {expandedSections.has('stock-inventory') && (
                  <div className="border-t p-2 space-y-2">
                    {/* View Page Permission */}
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium">View Page</label>
                        <p className="text-xs text-muted-foreground">
                          Allow user to access the Stock Inventory page
                        </p>
                      </div>
                      <Select
                        value={permissions.canViewStockInventory ? "YES" : "NO"}
                        onValueChange={(value) => 
                          handlePermissionChange("canViewStockInventory", value === "YES")
                        }
                        disabled={saving}
                      >
                        <SelectTrigger className="w-16 h-7 text-xs rounded-none border border-input">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="YES">YES</SelectItem>
                          <SelectItem value="NO">NO</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Generate Stock Report Permission */}
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium">Generate Stock Report</label>
                        <p className="text-xs text-muted-foreground">
                          Allow user to generate a stock report
                        </p>
                      </div>
                      <Select
                        value={permissions.canGenerateStockReport ? "YES" : "NO"}
                        onValueChange={(value) => 
                          handlePermissionChange("canGenerateStockReport", value === "YES")
                        }
                        disabled={saving}
                      >
                        <SelectTrigger className="w-16 h-7 text-xs rounded-none border border-input">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="YES">YES</SelectItem>
                          <SelectItem value="NO">NO</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Add Stock Item Permission */}
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium">Add Stock Item</label>
                        <p className="text-xs text-muted-foreground">
                          Allow user to add a new stock item
                        </p>
                      </div>
                      <Select
                        value={permissions.canAddStockItem ? "YES" : "NO"}
                        onValueChange={(value) => 
                          handlePermissionChange("canAddStockItem", value === "YES")
                        }
                        disabled={saving}
                      >
                        <SelectTrigger className="w-16 h-7 text-xs rounded-none border border-input">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="YES">YES</SelectItem>
                          <SelectItem value="NO">NO</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Generate Stock PDF Permission */}
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium">Generate Stock PDF</label>
                        <p className="text-xs text-muted-foreground">
                          Allow user to generate a stock PDF report
                        </p>
                      </div>
                      <Select
                        value={permissions.canGenerateStockPdf ? "YES" : "NO"}
                        onValueChange={(value) => 
                          handlePermissionChange("canGenerateStockPdf", value === "YES")
                        }
                        disabled={saving}
                      >
                        <SelectTrigger className="w-16 h-7 text-xs rounded-none border border-input">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="YES">YES</SelectItem>
                          <SelectItem value="NO">NO</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Delete Stock Record Permission */}
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium">Delete Stock Record</label>
                        <p className="text-xs text-muted-foreground">
                          Allow user to delete a stock record
                        </p>
                      </div>
                      <Select
                        value={permissions.canDeleteStockRecord ? "YES" : "NO"}
                        onValueChange={(value) => 
                          handlePermissionChange("canDeleteStockRecord", value === "YES")
                        }
                        disabled={saving}
                      >
                        <SelectTrigger className="w-16 h-7 text-xs rounded-none border border-input">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="YES">YES</SelectItem>
                          <SelectItem value="NO">NO</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>

              {/* Incoming Inspections Section */}
              <div className="border">
                <button
                  onClick={() => toggleSection('incoming-inspections')}
                  className="w-full flex items-center justify-between p-2 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 w-full">
                    <ClipboardCheck className="h-5 w-5 text-blue-500" />
                    <div className="flex flex-row items-center gap-2 w-full">
                      <h3 className="font-medium whitespace-nowrap">Incoming Inspections</h3>
                      <span className="text-sm text-muted-foreground truncate">Control access to incoming inspections functionality</span>
                    </div>
                  </div>
                  {expandedSections.has('incoming-inspections') ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>

                {expandedSections.has('incoming-inspections') && (
                  <div className="border-t p-2 space-y-2">
                    {/* View Page Permission */}
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium">View Page</label>
                        <p className="text-xs text-muted-foreground">
                          Allow user to access the Incoming Inspections page
                        </p>
                      </div>
                      <Select
                        value={permissions.canViewIncomingInspections ? "YES" : "NO"}
                        onValueChange={(value) => 
                          handlePermissionChange("canViewIncomingInspections", value === "YES")
                        }
                        disabled={saving}
                      >
                        <SelectTrigger className="w-16 h-7 text-xs rounded-none border border-input">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="YES">YES</SelectItem>
                          <SelectItem value="NO">NO</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Add New Inspection Permission */}
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium">Add New Inspection</label>
                        <p className="text-xs text-muted-foreground">
                          Allow user to see and use the Add New Inspection button
                        </p>
                      </div>
                      <Select
                        value={permissions.canAddIncomingInspections ? "YES" : "NO"}
                        onValueChange={(value) => 
                          handlePermissionChange("canAddIncomingInspections", value === "YES")
                        }
                        disabled={saving}
                      >
                        <SelectTrigger className="w-16 h-7 text-xs rounded-none border border-input">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="YES">YES</SelectItem>
                          <SelectItem value="NO">NO</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Delete Inspection Permission */}
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium">Delete Inspection</label>
                        <p className="text-xs text-muted-foreground">
                          Allow user to see and use the Delete Inspection button
                        </p>
                      </div>
                      <Select
                        value={permissions.canDeleteIncomingInspections ? "YES" : "NO"}
                        onValueChange={(value) => 
                          handlePermissionChange("canDeleteIncomingInspections", value === "YES")
                        }
                        disabled={saving}
                      >
                        <SelectTrigger className="w-16 h-7 text-xs rounded-none border border-input">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="YES">YES</SelectItem>
                          <SelectItem value="NO">NO</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>

              {/* Temperature Control Section */}
              <div className="border">
                <button
                  onClick={() => toggleSection('temperature-control')}
                  className="w-full flex items-center justify-between p-2 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 w-full">
                    <ThermometerSnowflake className="h-5 w-5 text-blue-500" />
                    <div className="flex flex-row items-center gap-2 w-full">
                      <h3 className="font-medium whitespace-nowrap">Temperature Control</h3>
                      <span className="text-sm text-muted-foreground truncate">Control access to temperature control functionality</span>
                    </div>
                  </div>
                  {expandedSections.has('temperature-control') ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>

                {expandedSections.has('temperature-control') && (
                  <div className="border-t p-2 space-y-2">
                    {/* Configure Ranges Permission */}
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium">Configure Ranges</label>
                        <p className="text-xs text-muted-foreground">
                          Allow user to see and use the Configure Ranges button
                        </p>
                      </div>
                      <Select
                        value={permissions.canConfigureTemperatureRanges ? "YES" : "NO"}
                        onValueChange={(value) => 
                          handlePermissionChange("canConfigureTemperatureRanges", value === "YES")
                        }
                        disabled={saving}
                      >
                        <SelectTrigger className="w-16 h-7 text-xs rounded-none border border-input">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="YES">YES</SelectItem>
                          <SelectItem value="NO">NO</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Add Temperature Permission */}
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium">Add Temperature</label>
                        <p className="text-xs text-muted-foreground">
                          Allow user to see and use the Add Temperature button
                        </p>
                      </div>
                      <Select
                        value={permissions.canAddTemperatureRecord ? "YES" : "NO"}
                        onValueChange={(value) => 
                          handlePermissionChange("canAddTemperatureRecord", value === "YES")
                        }
                        disabled={saving}
                      >
                        <SelectTrigger className="w-16 h-7 text-xs rounded-none border border-input">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="YES">YES</SelectItem>
                          <SelectItem value="NO">NO</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Delete Record Permission */}
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium">Delete Record</label>
                        <p className="text-xs text-muted-foreground">
                          Allow user to see and use the Delete Record button
                        </p>
                      </div>
                      <Select
                        value={permissions.canDeleteTemperatureRecord ? "YES" : "NO"}
                        onValueChange={(value) => 
                          handlePermissionChange("canDeleteTemperatureRecord", value === "YES")
                        }
                        disabled={saving}
                      >
                        <SelectTrigger className="w-16 h-7 text-xs rounded-none border border-input">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="YES">YES</SelectItem>
                          <SelectItem value="NO">NO</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>

              {/* Audit Management Section */}
              <div className="border">
                <button
                  onClick={() => toggleSection('audit-management')}
                  className="w-full flex items-center justify-between p-2 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 w-full">
                    <ClipboardCheck className="h-5 w-5 text-green-500" />
                    <div className="flex flex-row items-center gap-2 w-full">
                      <h3 className="font-medium whitespace-nowrap">Audit Management</h3>
                      <span className="text-sm text-muted-foreground truncate">Control access to audit management functionality</span>
                    </div>
                  </div>
                  {expandedSections.has('audit-management') ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </button>

                {expandedSections.has('audit-management') && (
                  <div className="p-4 space-y-4 border-t">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">View Audit Management</p>
                        <p className="text-sm text-muted-foreground">Allow access to audit management page</p>
                      </div>
                      <Select
                        value={permissions?.canSeeAuditManagement ? "true" : "false"}
                        onValueChange={(value) => handlePermissionChange('canSeeAuditManagement', value === "true")}
                      >
                        <SelectTrigger className="w-[100px]">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Yes</SelectItem>
                          <SelectItem value="false">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">No permissions found</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end mt-6">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
} 