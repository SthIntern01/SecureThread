import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { feedbackService, FeedbackData } from '../services/feedbackService';
import AppSidebar from "../components/AppSidebar";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EtherealBackground } from "../components/ui/ethereal-background";
import { useAuth } from "../contexts/AuthContext";
import {
  ChevronRight,
  Upload,
  Send,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  Bug,
  Lightbulb,
  Shield,
  FileText,
  X,
} from "lucide-react";
import {
  IconUser,
} from "@tabler/icons-react";

const SuccessModal = ({
  isOpen,
  onClose,
  trackingId,
}:  {
  isOpen: boolean;
  onClose: () => void;
  trackingId: string;
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white dark:bg-gray-900 border-gray-200 dark:border-white/20">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-green-600 dark: text-green-400">
            <CheckCircle size={20} />
            <span>Feedback Submitted</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-50 dark:bg-green-500/20 rounded-full mx-auto mb-4 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Thank you for your feedback!
            </h3>
            <p className="text-gray-600 dark:text-white/70 mb-4">
              Our team will review it and get back to you if needed.
            </p>
            <div className="bg-gray-50 dark:bg-white/10 p-3 rounded-lg border border-gray-200 dark:border-white/20">
              <p className="text-sm text-gray-700 dark:text-white/80">
                <span className="font-medium">Tracking ID:</span> {trackingId}
              </p>
            </div>
          </div>

          <Button 
            onClick={onClose} 
            style={{ color: 'white' }}
            className="w-full bg-[#003D6B] hover:bg-[#002A4D] dark:bg-orange-500 dark:hover:bg-orange-600"
          >
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Feedback = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [trackingId, setTrackingId] = useState("");

  const [formData, setFormData] = useState({
    type: "",
    severity: "Medium",
    description: "",
    stepsToReproduce: "",
    userEmail: "",
  });
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const feedbackTypes = [
    { value: "bug", label: "Bug Report", icon: Bug, color: "text-red-600 dark:text-red-400" },
    { value: "feature", label: "Feature Request", icon: Lightbulb, color: "text-[#003D6B] dark:text-blue-400" },
    { value: "security", label: "Security Concern", icon: Shield, color:  "text-orange-600 dark:text-orange-400" },
    { value: "general", label: "General Suggestion", icon: MessageSquare, color: "text-green-600 dark:text-green-400" },
  ];

  const severityLevels = [
    { value: "Low", color: "bg-green-50 text-green-700 dark:bg-green-500/20 dark:text-green-300" },
    { value: "Medium", color: "bg-yellow-50 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300" },
    { value: "High", color: "bg-red-50 text-red-700 dark:bg-red-500/20 dark:text-red-300" },
  ];

  const showSeverityField = formData.type === "bug" || formData.type === "security";
  const showStepsField = formData.type === "bug";

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target. files || []);
    
    if (files.length === 0) return;
    
    const validation = feedbackService.validateFiles(files);
    if (! validation.valid) {
      alert(`File validation failed:\n${validation.errors.join('\n')}`);
      event.target.value = '';
      return;
    }
    
    const currentCount = attachments.length;
    const availableSlots = 5 - currentCount;
    const filesToAdd = files.slice(0, availableSlots);
    
    if (filesToAdd.length < files.length) {
      alert(`Only ${availableSlots} more files can be added.  Maximum 5 files total.`);
    }
    
    setAttachments(prev => [...prev, ...filesToAdd]);
    event.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (attachments.length > 0) {
        const fileValidation = feedbackService.validateFiles(attachments);
        if (!fileValidation.valid) {
          alert(`File validation failed:\n${fileValidation.errors.join('\n')}`);
          setIsSubmitting(false);
          return;
        }
      }

      const feedbackData:  FeedbackData = {
        type: formData.type,
        severity: formData.severity,
        description: formData.description,
        stepsToReproduce: formData.stepsToReproduce || undefined,
        userEmail: formData.userEmail || undefined,
      };

      const response = await feedbackService.submitFeedback(feedbackData, attachments);
      
      setTrackingId(response.tracking_id);
      setShowSuccessModal(true);

      setFormData({
        type: "",
        severity: "Medium",
        description: "",
        stepsToReproduce: "",
        userEmail: "",
      });
      setAttachments([]);
      
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      
    } catch (error) {
      console.error('Submission failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit feedback.  Please try again.';
      alert(`Error: ${errorMessage}`);
      
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.type && formData.description.trim().length >= 10;

  return (
    // ID used for CSS specificity to override global styles safely
    <div id="feedback-page-container" className="w-full h-screen font-sans relative flex overflow-hidden">
      
      {/* LOCALIZED CSS OVERRIDES */}
      <style dangerouslySetInnerHTML={{ __html: `
        /* FORCE TEXT INPUT TRANSPARENCY 
           Using class + element selector to beat specific rules in index.css
        */
        .dark textarea.feedback-input-reset,
        .dark input.feedback-input-reset {
          background-color: transparent !important;
          background-image: none !important;
          border-color: rgba(255, 255, 255, 0.2) !important;
          color: white !important;
        }
        
        .dark .feedback-input-reset:focus {
          border-color: #f97316 !important;
          box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.2) !important;
        }

        /* --- BUTTON STYLES FOR DARK MODE (Unselected State) --- */
        /* Forces unselected buttons to be transparent with white borders */
        #feedback-page-container .dark .feedback-option-btn:not(.selected) {
          background-color: transparent !important;
          border-color: rgba(255, 255, 255, 0.2) !important;
          color: white !important;
        }

        #feedback-page-container .dark .feedback-option-btn:not(.selected):hover {
          background-color: rgba(255, 255, 255, 0.05) !important;
          border-color: rgba(255, 255, 255, 0.3) !important;
        }
      `}} />

      <EtherealBackground
        color="rgba(255, 255, 255, 0.6)"
        animation={{ scale: 100, speed: 90 }}
        noise={{ opacity: 0.8, scale: 1.2 }}
        sizing="fill"
      />

      <AppSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <div className="flex-1 overflow-y-auto overflow-x-hidden relative z-10">
        <div className="p-4 lg:p-6">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white dark: bg-white/10 backdrop-blur-lg rounded-3xl border border-gray-200 dark:border-white/20 shadow-2xl overflow-hidden">
              
              {/* Header Section */}
              <div className="p-8 border-b border-gray-200 dark:border-white/20">
                <div className="flex items-center space-x-2 text-sm mb-4">
                  <span className="font-medium text-gray-900 dark:text-white">SecureThread</span>
                  <ChevronRight size={16} className="text-gray-500 dark:text-white/60" />
                  <span className="font-medium text-gray-900 dark:text-white">Feedback</span>
                </div>

                <div className="text-center">
                  <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark: text-white mb-4">
                    Feedback & Suggestions
                  </h1>
                  <p className="text-gray-700 dark:text-white/80 text-lg max-w-2xl mx-auto">
                    We'd love to hear your thoughts! Share bugs, feature requests, or ideas to help us improve the platform.
                  </p>
                </div>
              </div>

              {/* Feedback Form Section */}
              <div className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Feedback Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
                      Feedback Type *
                    </label>
                    <div className="grid grid-cols-1 md: grid-cols-2 gap-3">
                      {feedbackTypes.map((type) => {
                        const IconComponent = type.icon;
                        const isSelected = formData.type === type.value;
                        return (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => handleInputChange("type", type.value)}
                            // Changed bg-white to bg-[#ffffff] to bypass index.css
                            // Updated Selected state: Uses dark:bg-orange-500/20 to avoid the white box in dark mode
                            className={`p-4 rounded-lg border-2 transition-all text-left feedback-option-btn ${
                              isSelected
                                ? "selected border-[#003D6B] bg-[#D6E6FF] dark:bg-orange-500/20 dark:border-orange-500"
                                : "border-gray-300 dark:border-white/20 bg-[#ffffff] dark:bg-transparent hover:bg-gray-50"
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <IconComponent className={`w-5 h-5 ${type. color}`} />
                              <span className="font-medium text-gray-900 dark:text-white">{type.label}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Severity/Priority */}
                  {showSeverityField && (
                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
                        Severity/Priority *
                      </label>
                      <Select value={formData.severity} onValueChange={(value) => handleInputChange("severity", value)}>
                        <SelectTrigger className="bg-white dark:bg-white/10 border-gray-300 dark:border-white/20 text-gray-900 dark:text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {severityLevels.map((level) => (
                            <SelectItem key={level.value} value={level. value}>
                              <Badge className={`text-xs border ${level.color}`}>
                                {level.value}
                              </Badge>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
                      Description *
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      placeholder="Please provide detailed information about your feedback..."
                      className="feedback-input-reset w-full p-4 bg-white dark:bg-transparent border border-gray-300 dark:border-white/20 rounded-lg text-gray-900 dark:text-white placeholder: text-gray-500 dark:placeholder:text-white/50 resize-none h-32 focus:ring-2 focus:ring-[#003D6B] dark:focus:ring-orange-500 focus:border-transparent"
                      required
                      minLength={10}
                    />
                    <p className="text-xs text-gray-600 dark:text-white/70 mt-1">
                      Minimum 10 characters ({formData.description.length}/10)
                    </p>
                  </div>

                  {/* Steps to Reproduce */}
                  {showStepsField && (
                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
                        Steps to Reproduce (Optional)
                      </label>
                      <textarea
                        value={formData.stepsToReproduce}
                        onChange={(e) => handleInputChange("stepsToReproduce", e.target.value)}
                        placeholder="1. Go to...  &#10;2. Click on... &#10;3. See error..."
                        className="feedback-input-reset w-full p-4 bg-white dark: bg-transparent border border-gray-300 dark:border-white/20 rounded-lg text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-white/50 resize-none h-24 focus:ring-2 focus:ring-[#003D6B] dark:focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                  )}

                  {/* File Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
                      Attachments (Optional)
                    </label>
                    <div className="border-2 border-dashed border-gray-300 dark:border-white/30 rounded-lg p-6 text-center bg-gray-50 dark:bg-white/5">
                      <Upload className="w-8 h-8 text-gray-400 dark:text-white/50 mx-auto mb-2" />
                      <p className="text-gray-600 dark:text-white/70 mb-2">
                        Drop files here or click to upload
                      </p>
                      <p className="text-xs text-gray-500 dark: text-white/50 mb-4">
                        Screenshots, logs, or other files (Max 5 files, 10MB each)
                      </p>
                      <input
                        type="file"
                        multiple
                        accept=".png,.jpg,.jpeg,.pdf,.txt,.log,.json"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                      />
                      <label
                        htmlFor="file-upload"
                        className="inline-flex items-center px-4 py-2 bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg text-gray-700 dark:text-white hover: bg-gray-100 dark:hover:bg-white/20 cursor-pointer transition-colors"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Choose Files
                      </label>
                    </div>

                    {attachments.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {attachments. map((file, index) => (
                          <div key={index} className="flex items-center justify-between bg-white dark:bg-white/10 p-3 rounded-lg border border-gray-200 dark:border-white/20">
                            <div className="flex items-center space-x-2">
                              <FileText className="w-4 h-4 text-gray-600 dark:text-white/70" />
                              <span className="text-gray-900 dark:text-white text-sm">{file.name}</span>
                              <span className="text-gray-500 dark:text-white/50 text-xs">
                                ({(file.size / 1024 / 1024).toFixed(2)} MB)
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeAttachment(index)}
                              className="text-gray-600 dark:text-white/70 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div>
                    <Button
                      type="submit"
                      disabled={!isFormValid || isSubmitting}
                      style={{ color: 'white' }}
                      className="w-full bg-[#003D6B] hover:bg-[#002A4D] dark:bg-orange-500 dark:hover:bg-orange-600 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-2" />
                          Submit Feedback
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>

              {/* Security Disclosure Section */}
              <div className="p-8 bg-[#FFF4ED] dark:bg-orange-500/10 border-t border-gray-200 dark:border-white/20">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-[#D6E6FF] dark:bg-orange-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-6 h-6 text-[#003D6B] dark:text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Security Disclosure Notice
                    </h3>
                    <p className="text-gray-700 dark:text-white/80 leading-relaxed">
                      If you've discovered a critical security vulnerability in this platform, 
                      please submit it under <span className="font-semibold">Security Concern</span> or 
                      email us directly at{" "}
                      <a 
                        href="mailto:security@securethread.com" 
                        className="text-[#4A90E2] hover:text-[#003D6B] dark:text-orange-400 dark:hover:text-orange-500 underline font-medium transition-colors"
                      >
                        security@securethread. com
                      </a>
                      .  We follow responsible disclosure practices and will work with you to 
                      address any security issues promptly.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        trackingId={trackingId}
      />
    </div>
  );
};

export default Feedback;
