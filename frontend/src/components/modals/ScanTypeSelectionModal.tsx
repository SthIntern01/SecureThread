import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Shield, Sparkles, ChevronRight } from "lucide-react";

interface ScanTypeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRuleBased: () => void;
  onSelectLLMBased: () => void;
}

export const ScanTypeSelectionModal: React.FC<ScanTypeSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectRuleBased,
  onSelectLLMBased,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Choose Scanning Type</DialogTitle>
          <DialogDescription>
            Select the type of security scan you want to perform on your repository
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-6">
          {/* Rule-Based Scanning */}
          <div
            onClick={onSelectRuleBased}
            className="group relative flex items-start gap-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-6 cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-lg transition-all duration-200"
          >
            <div className="flex-shrink-0 mt-1">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                Rule-Based Scanning
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Fast and efficient scanning using predefined security rules. Ideal for quick checks and CI/CD integration.
              </p>
              <ul className="text-xs text-gray-500 dark:text-gray-500 space-y-1">
                <li>✓ Fast execution time</li>
                <li>✓ Custom rule configuration</li>
                <li>✓ Pattern-based detection</li>
                <li>✓ Optional LLM enhancement</li>
              </ul>
            </div>
            
            <ChevronRight className="flex-shrink-0 w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-transform" />
          </div>

          {/* LLM-Based Scanning */}
          <div
            onClick={onSelectLLMBased}
            className="group relative flex items-start gap-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-6 cursor-pointer hover:border-purple-500 dark:hover:border-purple-400 hover:shadow-lg transition-all duration-200"
          >
            <div className="flex-shrink-0 mt-1">
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold group-hover:text-purple-600 dark:group-hover:text-purple-400">
                  LLM-Based Scanning
                </h3>
                <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                  AI-Powered
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Comprehensive AI-powered analysis with detailed explanations and fix recommendations. Best for thorough security audits.
              </p>
              <ul className="text-xs text-gray-500 dark:text-gray-500 space-y-1">
                <li>✓ Deep context understanding</li>
                <li>✓ Detailed explanations & solutions</li>
                <li>✓ Code fix examples</li>
                <li>✓ Advanced threat detection</li>
              </ul>
            </div>
            
            <ChevronRight className="flex-shrink-0 w-5 h-5 text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};