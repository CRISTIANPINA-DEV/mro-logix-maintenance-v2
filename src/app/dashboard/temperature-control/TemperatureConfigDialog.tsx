"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Settings, Loader2 } from "lucide-react";

interface TemperatureConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigUpdate: () => void;
}

interface ConfigData {
  tempNormalMin: number;
  tempNormalMax: number;
  tempMediumMin: number;
  tempMediumMax: number;
  tempHighMin: number;
  humidityNormalMin: number;
  humidityNormalMax: number;
  humidityMediumMin: number;
  humidityMediumMax: number;
  humidityHighMin: number;
}

export function TemperatureConfigDialog({ isOpen, onClose, onConfigUpdate }: TemperatureConfigDialogProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<ConfigData>({
    tempNormalMin: 0,
    tempNormalMax: 24,
    tempMediumMin: 25,
    tempMediumMax: 35,
    tempHighMin: 36,
    humidityNormalMin: 0,
    humidityNormalMax: 35,
    humidityMediumMin: 36,
    humidityMediumMax: 65,
    humidityHighMin: 66,
  });
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchConfig();
    }
  }, [isOpen]);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/temperature-humidity-config');
      const result = await response.json();
      
      if (result.success) {
        setConfig({
          tempNormalMin: result.data.tempNormalMin,
          tempNormalMax: result.data.tempNormalMax,
          tempMediumMin: result.data.tempMediumMin,
          tempMediumMax: result.data.tempMediumMax,
          tempHighMin: result.data.tempHighMin,
          humidityNormalMin: result.data.humidityNormalMin,
          humidityNormalMax: result.data.humidityNormalMax,
          humidityMediumMin: result.data.humidityMediumMin,
          humidityMediumMax: result.data.humidityMediumMax,
          humidityHighMin: result.data.humidityHighMin,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch configuration",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching config:', error);
      toast({
        title: "Error", 
        description: "Failed to fetch configuration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      // Validation
      if (config.tempNormalMin >= config.tempNormalMax) {
        toast({
          title: "Invalid Range",
          description: "Temperature normal minimum must be less than maximum",
          variant: "destructive",
        });
        return;
      }

      if (config.tempMediumMin >= config.tempMediumMax) {
        toast({
          title: "Invalid Range",
          description: "Temperature medium minimum must be less than maximum",
          variant: "destructive",
        });
        return;
      }

      if (config.humidityNormalMin >= config.humidityNormalMax) {
        toast({
          title: "Invalid Range",
          description: "Humidity normal minimum must be less than maximum",
          variant: "destructive",
        });
        return;
      }

      if (config.humidityMediumMin >= config.humidityMediumMax) {
        toast({
          title: "Invalid Range",
          description: "Humidity medium minimum must be less than maximum",
          variant: "destructive",
        });
        return;
      }

      setSaving(true);
      const response = await fetch('/api/temperature-humidity-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Success",
          description: "Configuration updated successfully",
        });
        onConfigUpdate(); // Notify parent to refresh
        onClose();
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to update configuration",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error saving config:', error);
      toast({
        title: "Error",
        description: "Failed to update configuration",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof ConfigData, value: string) => {
    const numValue = parseFloat(value) || 0;
    setConfig(prev => ({
      ...prev,
      [field]: numValue
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Temperature & Humidity Range Configuration
          </DialogTitle>
          <DialogDescription>
            Configure the ranges for temperature and humidity levels. These settings will affect how data is colored and categorized throughout the system.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading configuration...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Temperature Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-blue-600">Temperature Ranges (°C)</h3>
              
              {/* Normal Temperature Range */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-3">Normal Range</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tempNormalMin">Minimum (°C)</Label>
                    <Input
                      id="tempNormalMin"
                      type="number"
                      step="0.1"
                      value={config.tempNormalMin}
                      onChange={(e) => handleInputChange('tempNormalMin', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tempNormalMax">Maximum (°C)</Label>
                    <Input
                      id="tempNormalMax"
                      type="number"
                      step="0.1"
                      value={config.tempNormalMax}
                      onChange={(e) => handleInputChange('tempNormalMax', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Medium Temperature Range */}
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-3">Medium Range</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tempMediumMin">Minimum (°C)</Label>
                    <Input
                      id="tempMediumMin"
                      type="number"
                      step="0.1"
                      value={config.tempMediumMin}
                      onChange={(e) => handleInputChange('tempMediumMin', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tempMediumMax">Maximum (°C)</Label>
                    <Input
                      id="tempMediumMax"
                      type="number"
                      step="0.1"
                      value={config.tempMediumMax}
                      onChange={(e) => handleInputChange('tempMediumMax', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  Any temperature above {config.tempMediumMax}°C will be considered 'High'.
                </div>
              </div>

              {/* High Temperature Range */}
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-medium text-red-800 mb-3">High Range</h4>
                <div>
                  <Label htmlFor="tempHighMin">Minimum (°C)</Label>
                  <Input
                    id="tempHighMin"
                    type="number"
                    step="0.1"
                    value={config.tempHighMin}
                    onChange={(e) => handleInputChange('tempHighMin', e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-sm text-red-600 mt-1">Values equal to or above this will be considered high</p>
                </div>
              </div>
            </div>

            {/* Humidity Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-blue-600">Humidity Ranges (%)</h3>
              
              {/* Normal Humidity Range */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-3">Normal Range</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="humidityNormalMin">Minimum (%)</Label>
                    <Input
                      id="humidityNormalMin"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={config.humidityNormalMin}
                      onChange={(e) => handleInputChange('humidityNormalMin', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="humidityNormalMax">Maximum (%)</Label>
                    <Input
                      id="humidityNormalMax"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={config.humidityNormalMax}
                      onChange={(e) => handleInputChange('humidityNormalMax', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Medium Humidity Range */}
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-3">Medium Range</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="humidityMediumMin">Minimum (%)</Label>
                    <Input
                      id="humidityMediumMin"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={config.humidityMediumMin}
                      onChange={(e) => handleInputChange('humidityMediumMin', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="humidityMediumMax">Maximum (%)</Label>
                    <Input
                      id="humidityMediumMax"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={config.humidityMediumMax}
                      onChange={(e) => handleInputChange('humidityMediumMax', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* High Humidity Range */}
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-medium text-red-800 mb-3">High Range</h4>
                <div>
                  <Label htmlFor="humidityHighMin">Minimum (%)</Label>
                  <Input
                    id="humidityHighMin"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={config.humidityHighMin}
                    onChange={(e) => handleInputChange('humidityHighMin', e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-sm text-red-600 mt-1">Values equal to or above this will be considered high</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                variant="neutral" 
                onClick={onClose}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button 
                variant="save"
                onClick={handleSave} 
                disabled={saving}
                className="cursor-pointer"
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Configuration
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 