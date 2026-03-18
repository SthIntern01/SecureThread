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
      <DialogContent className="sm:max-w-[600px] bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-gray-200/50 dark:border-white/10 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            Choose Scanning Type
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-white/70">
            Select the type of security scan you want to perform on your repository
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-6">
          {/* Rule-Based Scanning */}
          <div
            onClick={onSelectRuleBased}
            className="group relative flex items-start gap-4 rounded-xl border border-gray-200/60 dark:border-white/10 bg-white/40 dark:bg-white/5 backdrop-blur-md p-6 cursor-pointer hover:bg-white/60 dark:hover:bg-white/10 hover:border-[#003D6B]/50 dark:hover:border-blue-400/50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgba(59,130,246,0.1)] transition-all duration-300"
          >
            <div className="flex-shrink-0 mt-1">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#D6E6FF] to-[#F0F5FF] dark:from-blue-500/20 dark:to-blue-900/20 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-sm">
                <Shield className="w-6 h-6 text-[#003D6B] dark:text-blue-400" />
              </div>
            </div>
            
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white group-hover:text-[#003D6B] dark:group-hover:text-blue-400 transition-colors">
                Rule-Based Scanning
              </h3>
              <p className="text-sm text-gray-600 dark:text-white/70 mb-3">
                Fast and efficient scanning using predefined security rules. Ideal for quick checks and CI/CD integration.
              </p>
              <ul className="text-xs text-gray-500 dark:text-white/50 space-y-1.5 font-medium">
                <li className="flex items-center gap-1.5"><span className="text-[#003D6B] dark:text-blue-400">✓</span> Fast execution time</li>
                <li className="flex items-center gap-1.5"><span className="text-[#003D6B] dark:text-blue-400">✓</span> Custom rule configuration</li>
                <li className="flex items-center gap-1.5"><span className="text-[#003D6B] dark:text-blue-400">✓</span> Pattern-based detection</li>
              </ul>
            </div>
            
            <ChevronRight className="flex-shrink-0 w-5 h-5 text-gray-400 dark:text-white/30 group-hover:text-[#003D6B] dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
          </div>

          {/* LLM-Based Scanning */}
          <div
            onClick={onSelectLLMBased}
            className="group relative flex items-start gap-4 rounded-xl border border-gray-200/60 dark:border-white/10 bg-white/40 dark:bg-white/5 backdrop-blur-md p-6 cursor-pointer hover:bg-white/60 dark:hover:bg-white/10 hover:border-orange-500/50 dark:hover:border-orange-400/50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgba(249,115,22,0.1)] transition-all duration-300"
          >
            <div className="flex-shrink-0 mt-1">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-100 to-orange-50 dark:from-orange-500/20 dark:to-orange-900/20 border border-orange-200/50 dark:border-orange-500/20 flex items-center justify-center group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 shadow-sm">
                <Sparkles className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                  LLM-Based Scanning
                </h3>
                <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-orange-500/10 to-red-500/10 dark:from-orange-500/20 dark:to-red-500/20 text-orange-600 dark:text-orange-300 border border-orange-200/50 dark:border-orange-500/30 rounded-full">
                  AI-Powered
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-white/70 mb-3">
                Comprehensive AI-powered analysis with detailed explanations and fix recommendations. Best for thorough security audits.
              </p>
              <ul className="text-xs text-gray-500 dark:text-white/50 space-y-1.5 font-medium">
                <li className="flex items-center gap-1.5"><span className="text-orange-500 dark:text-orange-400">✓</span> Deep context understanding</li>
                <li className="flex items-center gap-1.5"><span className="text-orange-500 dark:text-orange-400">✓</span> Detailed explanations & solutions</li>
                <li className="flex items-center gap-1.5"><span className="text-orange-500 dark:text-orange-400">✓</span> Advanced threat detection</li>
              </ul>
            </div>
            
            <ChevronRight className="flex-shrink-0 w-5 h-5 text-gray-400 dark:text-white/30 group-hover:text-orange-600 dark:group-hover:text-orange-400 group-hover:translate-x-1 transition-all" />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-200/60 dark:border-white/10">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="border-gray-300 dark:border-white/20 bg-white/50 dark:bg-white/5 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-white/10 dark:hover:text-white backdrop-blur-sm transition-colors"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};