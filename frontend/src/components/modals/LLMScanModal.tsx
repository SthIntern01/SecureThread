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
import { Sparkles, AlertCircle } from "lucide-react";

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
  // Allow empty string to fix the typing/backspace bug
  const [maxFiles, setMaxFiles] = useState<number | ''>(50);
  const [isScanning, setIsScanning] = useState(false);

  const handleStartScan = () => {
    setIsScanning(true);
    onStartScan({
      max_files: typeof maxFiles === 'number' ? maxFiles : 50,
      priority_level: 'all', // Fallback as priority is removed from UI but still in interface
    });
  };

  // Helper to validate scan capability
  const isValidFileCount = typeof maxFiles === 'number' && maxFiles >= 1 && maxFiles <= 500;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-gray-200/50 dark:border-white/10 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-100 to-orange-50 dark:from-orange-500/20 dark:to-orange-900/20 border border-orange-200/50 dark:border-orange-500/20 flex items-center justify-center shadow-sm">
              <Sparkles className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <DialogTitle className="text-xl text-gray-900 dark:text-white">
                LLM-Based Scan Configuration
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600 dark:text-white/70 mt-1">
                {repositoryName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Max Files */}
          <div className="space-y-3">
            <Label htmlFor="max-files" className="text-sm font-medium text-gray-900 dark:text-white">
              Maximum Files to Scan
            </Label>
            <Input
              id="max-files"
              type="number"
              min={1}
              max={500}
              value={maxFiles}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '') {
                  setMaxFiles('');
                } else {
                  const num = parseInt(val, 10);
                  if (!isNaN(num)) setMaxFiles(num);
                }
              }}
              className="w-full bg-white/50 dark:bg-white/5 border-gray-300/50 dark:border-white/20 focus:border-orange-500 dark:focus:border-orange-500 transition-colors text-gray-900 dark:text-white"
            />
            <p className="text-xs text-gray-500 dark:text-white/50">
              Limit: 1-500 files. More files = longer scan time.
            </p>
          </div>

          {/* Info Alert */}
          <div className="rounded-xl border border-blue-200/60 dark:border-blue-500/20 bg-blue-50/50 dark:bg-blue-500/5 backdrop-blur-md p-4 flex gap-3">
            <AlertCircle className="h-5 w-5 text-[#003D6B] dark:text-blue-400 shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              <strong className="text-gray-900 dark:text-white font-semibold">AI-Powered Analysis:</strong> This scan uses DeepSeek AI to provide comprehensive security analysis with detailed explanations and code fix examples. Results may take longer but provide deeper insights.
            </p>
          </div>
        </div>

        <DialogFooter className="border-t border-gray-200/60 dark:border-white/10 pt-4 mt-2">
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={isScanning}
            className="border-gray-300 dark:border-white/20 bg-white/50 dark:bg-white/5 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-white/10 dark:hover:text-white transition-colors"
          >
            Cancel
          </Button>
          <Button
            onClick={handleStartScan}
            disabled={isScanning || !isValidFileCount}
            style={{ color: 'white' }}
            className="bg-orange-500 hover:bg-orange-600 dark:bg-orange-500 dark:hover:bg-orange-600 shadow-md transition-all"
          >
            {isScanning ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
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