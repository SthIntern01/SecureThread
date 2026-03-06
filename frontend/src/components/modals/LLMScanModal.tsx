import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, AlertCircle, DollarSign, Clock } from "lucide-react";

interface LLMScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartScan: (config: LLMScanConfig) => void;
  repositoryName: string;
}

export interface LLMScanConfig {
  max_files: number;
  priority_level: string;
}

export const LLMScanModal: React.FC<LLMScanModalProps> = ({
  isOpen,
  onClose,
  onStartScan,
  repositoryName,
}) => {
  const [maxFiles, setMaxFiles] = useState<number>(50);
  const [priorityLevel, setPriorityLevel] = useState<string>('all');
  const [isScanning, setIsScanning] = useState(false);

  const priorityOptions = [
    {
      value: 'critical',
      label: 'Critical Only',
      description: 'RCE, SQL Injection, Authentication Bypass',
      color: 'text-red-600 dark:text-red-400',
    },
    {
      value: 'high',
      label: 'Critical & High',
      description: 'XSS, CSRF, Sensitive Data Exposure',
      color: 'text-orange-600 dark:text-orange-400',
    },
    {
      value: 'medium',
      label: 'Critical, High & Medium',
      description: 'Input Validation, Session Management',
      color: 'text-yellow-600 dark:text-yellow-400',
    },
    {
      value: 'low',
      label: 'All Severity Levels',
      description: 'Includes informational issues',
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      value: 'all',
      label: 'Complete Analysis',
      description: 'Full security audit + best practices',
      color: 'text-purple-600 dark:text-purple-400',
    },
  ];

  // Cost and time estimation
  const estimateCost = () => {
    const baseTokensPerFile = 2000; // Average tokens per file
    const totalTokens = maxFiles * baseTokensPerFile;
    const costPerMillionTokens = 0.14; // DeepSeek pricing
    return ((totalTokens / 1000000) * costPerMillionTokens).toFixed(4);
  };

  const estimateTime = () => {
    const secondsPerFile = 3;
    const priorityMultiplier = {
      critical: 0.5,
      high: 0.7,
      medium: 1.0,
      low: 1.2,
      all: 1.5,
    };
    const multiplier = priorityMultiplier[priorityLevel as keyof typeof priorityMultiplier] || 1.0;
    const totalSeconds = Math.ceil(maxFiles * secondsPerFile * multiplier);
    
    if (totalSeconds < 60) return `~${totalSeconds}s`;
    const minutes = Math.ceil(totalSeconds / 60);
    return `~${minutes}min`;
  };

  const handleStartScan = () => {
    setIsScanning(true);
    onStartScan({
      max_files: maxFiles,
      priority_level: priorityLevel,
    });
  };

  const selectedPriority = priorityOptions.find(p => p.value === priorityLevel);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <DialogTitle className="text-xl">LLM-Based Scan Configuration</DialogTitle>
              <DialogDescription className="text-sm">
                {repositoryName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Max Files */}
          <div className="space-y-2">
            <Label htmlFor="max-files" className="text-sm font-medium">
              Maximum Files to Scan
            </Label>
            <Input
              id="max-files"
              type="number"
              min={1}
              max={500}
              value={maxFiles}
              onChange={(e) => setMaxFiles(parseInt(e.target.value) || 50)}
              className="w-full"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Limit: 1-500 files. More files = longer scan time and higher cost.
            </p>
          </div>

          {/* Priority Level */}
          <div className="space-y-2">
            <Label htmlFor="priority" className="text-sm font-medium">
              Scan Priority Level
            </Label>
            <Select value={priorityLevel} onValueChange={setPriorityLevel}>
              <SelectTrigger id="priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {priorityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex flex-col items-start py-1">
                      <span className={`font-medium ${option.color}`}>
                        {option.label}
                      </span>
                      <span className="text-xs text-gray-500">
                        {option.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPriority && (
              <p className="text-xs text-gray-600 dark:text-gray-400">
                <span className={selectedPriority.color}>Selected: {selectedPriority.label}</span>
                {' - '}
                {selectedPriority.description}
              </p>
            )}
          </div>

          {/* Estimates */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Estimated Time</p>
                <p className="text-sm font-semibold">{estimateTime()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Estimated Cost</p>
                <p className="text-sm font-semibold">${estimateCost()}</p>
              </div>
            </div>
          </div>

          {/* Info Alert */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>AI-Powered Analysis:</strong> This scan uses DeepSeek AI to provide
              comprehensive security analysis with detailed explanations and code fix examples.
              Results may take longer but provide deeper insights.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isScanning}>
            Cancel
          </Button>
          <Button
            onClick={handleStartScan}
            disabled={isScanning || maxFiles < 1 || maxFiles > 500}
            className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700"
          >
            {isScanning ? (
              <>
                <span className="animate-spin mr-2">⚡</span>
                Starting Scan...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Start LLM Scan
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};