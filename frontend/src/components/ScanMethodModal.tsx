import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Zap, Settings, ChevronRight, X } from "lucide-react";
import CustomScanModal from "./CustomScanModal";

interface ScanMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGenAI: () => void;
  onSelectCustom: () => void;
  projectName?: string;
}

const ScanMethodModal: React.FC<ScanMethodModalProps> = ({
  isOpen,
  onClose,
  onSelectGenAI,
  onSelectCustom,
  projectName
}) => {
  const [showCustomScanModal, setShowCustomScanModal] = useState(false);

  const handleCustomScanClick = () => {
    setShowCustomScanModal(true);
  };

  const handleCustomScanStart = async (selectedRules: number[], customRules?: any[]) => {
    // Close modals
    setShowCustomScanModal(false);
    
    // Call the original onSelectCustom with the rule data
    onSelectCustom();
    
    // Here you would implement the actual custom scan API call
    console.log("Starting custom scan with:", { selectedRules, customRules });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl">
          {/* Custom Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 flex items-center justify-center text-white/70 hover:text-white transition-all duration-200 group"
          >
            <X className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </button>
          
          <div className="px-8 py-6">
            <DialogHeader className="text-center mb-8">
              <DialogTitle className="text-3xl font-bold text-white mb-2">
                Choose Your Scanning Method
              </DialogTitle>
              <p className="text-white/70 text-lg">
                Select the scanning approach that best fits your security requirements
                {projectName && (
                  <span className="block text-sm mt-1 text-white/50">
                    for {projectName}
                  </span>
                )}
              </p>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Gen AI Scan Card */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:border-orange-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/10">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Gen AI Scan</h3>
                  <p className="text-white/70 mb-6 leading-relaxed">
                    AI-powered vulnerability detection using our advanced LLM engine for intelligent, 
                    automated, and comprehensive security analysis
                  </p>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center space-x-3 text-white/80">
                    <Zap className="w-5 h-5 text-orange-400" />
                    <span>Automated Detection</span>
                  </div>
                  <div className="flex items-center space-x-3 text-white/80">
                    <div className="w-5 h-5 rounded-full border-2 border-orange-400 flex items-center justify-center">
                      <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                    </div>
                    <span>Smart Analysis</span>
                  </div>
                </div>

                <Button
                  onClick={onSelectGenAI}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-4 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/25 group"
                >
                  Get Started
                  <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>

              {/* Custom Scan Card */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:border-orange-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/10">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Settings className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Custom Scan</h3>
                  <p className="text-white/70 mb-6 leading-relaxed">
                    Combine our predefined security rules with your own custom rules for tailored 
                    vulnerability detection, compliance, and deeper control
                  </p>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center space-x-3 text-white/80">
                    <div className="w-5 h-5 text-orange-400">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M16 18l6-6-6-6" />
                        <path d="M8 6l6 6-6 6" />
                      </svg>
                    </div>
                    <span>Custom Rules</span>
                  </div>
                  <div className="flex items-center space-x-3 text-white/80">
                    <Settings className="w-5 h-5 text-orange-400" />
                    <span>Flexible Config</span>
                  </div>
                </div>

                <Button
                  onClick={handleCustomScanClick}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-4 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/25 group"
                >
                  Get Started
                  <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>

            <div className="text-center mt-8">
              <Button
                onClick={onClose}
                variant="ghost"
                className="text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Custom Scan Modal */}
      <CustomScanModal
        isOpen={showCustomScanModal}
        onClose={() => setShowCustomScanModal(false)}
        onStartScan={handleCustomScanStart}
        projectName={projectName}
      />
    </>
  );
};

export default ScanMethodModal;