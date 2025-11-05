import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronDown, 
  ChevronRight, 
  Upload, 
  FileText, 
  Shield,
  AlertTriangle,
  Zap,
  CheckCircle2,
  X
} from "lucide-react";

interface Rule {
  id: number;
  name: string;
  description: string;
  category: string;
  severity: string;
  rule_content: string;
  is_active: boolean;
}

interface CustomScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartScan: (selectedRules: number[], customRules?: any[]) => void;
  projectName?: string;
}

const CustomScanModal: React.FC<CustomScanModalProps> = ({
  isOpen,
  onClose,
  onStartScan,
  projectName
}) => {
  const [builtInRules, setBuiltInRules] = useState<Rule[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedRules, setSelectedRules] = useState<Set<number>>(new Set());
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [customRules, setCustomRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      fetchBuiltInRules();
      // Select all rules by default
      setExpandedCategories(new Set(['web_vulnerability']));
    }
  }, [isOpen]);

  const fetchBuiltInRules = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/scan-rules/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setBuiltInRules(data.rules || []);
        // Select all rules by default
        const allRuleIds = new Set((data.rules || []).map((rule: Rule) => rule.id));
        setSelectedRules(allRuleIds);
      } else {
        setError("Failed to fetch scan rules");
      }
    } catch (err) {
      console.error("Error fetching rules:", err);
      setError("Network error occurred while fetching rules");
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'web_vulnerability':
        return <Shield className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'web_vulnerability':
        return 'Web Security';
      default:
        return category.replace('_', ' ').toUpperCase();
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'bg-red-500 text-white';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-black';
      case 'low':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleRule = (ruleId: number) => {
    const newSelected = new Set(selectedRules);
    if (newSelected.has(ruleId)) {
      newSelected.delete(ruleId);
    } else {
      newSelected.add(ruleId);
    }
    setSelectedRules(newSelected);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/json') {
        setError("Please upload a JSON file");
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError("File size must be less than 5MB");
        return;
      }

      setUploadedFile(file);
      setError("");
      
      // Parse JSON file
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const jsonData = JSON.parse(content);
          
          // Validate JSON structure
          if (Array.isArray(jsonData) && jsonData.length > 0) {
            // Validate each rule has required fields
            const validRules = jsonData.filter(rule => 
              rule.name && rule.description && rule.rule_content
            );
            setCustomRules(validRules);
            
            if (validRules.length !== jsonData.length) {
              setError(`${jsonData.length - validRules.length} invalid rules were skipped`);
            }
          } else {
            setError("JSON must contain an array of rule objects");
          }
        } catch (err) {
          setError("Invalid JSON format");
          setUploadedFile(null);
        }
      };
      reader.readAsText(file);
    }
  };

  const removeUploadedFile = () => {
    setUploadedFile(null);
    setCustomRules([]);
    setError("");
  };

  const handleStartScan = () => {
    if (selectedRules.size === 0 && customRules.length === 0) {
      setError("Please select at least one rule or upload custom rules");
      return;
    }

    onStartScan(Array.from(selectedRules), customRules.length > 0 ? customRules : undefined);
  };

  // Group rules by category
  const rulesByCategory = builtInRules.reduce((acc, rule) => {
    if (!acc[rule.category]) {
      acc[rule.category] = [];
    }
    acc[rule.category].push(rule);
    return acc;
  }, {} as Record<string, Rule[]>);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden bg-gray-100/80 dark:bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl">
        {/* Custom Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 w-8 h-8 rounded-full bg-gray-100/80 dark:bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 flex items-center justify-center text-white/70 hover:theme-text transition-all duration-200 group"
        >
          <X className="w-4 h-4 group-hover:scale-110 transition-transform" />
        </button>

        <div className="flex flex-col h-[90vh]">
          {/* Header */}
          <div className="px-8 py-6 border-b theme-border">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold theme-text mb-2">
                Custom Security Scan Configuration
              </DialogTitle>
              <p className="text-white/70">
                Select security rules and upload custom rules for {projectName}
              </p>
            </DialogHeader>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex">
            {/* Left Panel - Built-in Rules */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="mb-6">
                <h3 className="text-lg font-semibold theme-text mb-4 flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-orange-400" />
                  Built-in Security Rules
                </h3>

                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400 mx-auto mb-4"></div>
                    <p className="text-white/70">Loading rules...</p>
                  </div>
                ) : error && builtInRules.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <p className="text-red-400 mb-4">{error}</p>
                    <Button
                      onClick={fetchBuiltInRules}
                      variant="outline"
                      className="bg-gray-100/80 dark:bg-white/10 border-white/20 theme-text hover:bg-white/20"
                    >
                      Try Again
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(rulesByCategory).map(([category, rules]) => (
                      <div key={category} className="theme-bg-subtle rounded-lg border theme-border">
                        {/* Category Header */}
                        <button
                          onClick={() => toggleCategory(category)}
                          className="w-full flex items-center justify-between p-4 hover:theme-bg-subtle transition-colors rounded-t-lg"
                        >
                          <div className="flex items-center space-x-3">
                            {getCategoryIcon(category)}
                            <span className="theme-text font-medium">
                              {getCategoryLabel(category)}
                            </span>
                            <Badge className="bg-orange-500 theme-text text-xs">
                              {rules.length} rules
                            </Badge>
                          </div>
                          {expandedCategories.has(category) ? (
                            <ChevronDown className="w-4 h-4 text-white/70" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-white/70" />
                          )}
                        </button>

                        {/* Category Rules */}
                        {expandedCategories.has(category) && (
                          <div className="border-t theme-border">
                            {rules.map((rule) => (
                              <div
                                key={rule.id}
                                className="p-4 border-b border-white/5 last:border-b-0 hover:theme-bg-subtle transition-colors"
                              >
                                <div className="flex items-start space-x-3">
                                  <input
                                    type="checkbox"
                                    id={`rule-${rule.id}`}
                                    checked={selectedRules.has(rule.id)}
                                    onChange={() => toggleRule(rule.id)}
                                    className="mt-1 w-4 h-4 text-orange-500 bg-gray-100/80 dark:bg-white/10 border-white/30 rounded focus:ring-orange-500 focus:ring-2"
                                  />
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-2">
                                      <label
                                        htmlFor={`rule-${rule.id}`}
                                        className="text-sm font-medium theme-text cursor-pointer"
                                      >
                                        {rule.name}
                                      </label>
                                      <Badge className={`text-xs ${getSeverityColor(rule.severity)}`}>
                                        {rule.severity.toUpperCase()}
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-white/70">
                                      {rule.description}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel - Custom Rules Upload */}
            <div className="w-80 p-6 border-l theme-border theme-bg-subtle">
              <h3 className="text-lg font-semibold theme-text mb-4 flex items-center">
                <Upload className="w-5 h-5 mr-2 text-orange-400" />
                Custom Rules
              </h3>

              {/* File Upload Area */}
              <div className="mb-4">
                {!uploadedFile ? (
                  <label className="block cursor-pointer">
                    <div className="border-2 border-dashed border-white/30 rounded-lg p-6 text-center hover:border-orange-400 transition-colors">
                      <Upload className="w-8 h-8 text-white/50 mx-auto mb-3" />
                      <p className="text-white/70 text-sm mb-2">
                        Upload JSON Rules File
                      </p>
                      <p className="text-white/50 text-xs">
                        Max 5MB, JSON format only
                      </p>
                    </div>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="bg-gray-100/80 dark:bg-white/10 rounded-lg p-4 border border-white/20">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-orange-400" />
                        <span className="theme-text text-sm font-medium">
                          {uploadedFile.name}
                        </span>
                      </div>
                      <button
                        onClick={removeUploadedFile}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      <span className="text-white/70 text-xs">
                        {customRules.length} custom rules loaded
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* JSON Format Example */}
              <div className="theme-bg-subtle rounded-lg p-4 border theme-border">
                <h4 className="theme-text text-sm font-medium mb-2">JSON Format:</h4>
                <pre className="theme-text-muted text-xs overflow-x-auto">
{`[
  {
    "name": "Rule Name",
    "description": "Rule description",
    "category": "web_vulnerability",
    "severity": "high",
    "rule_content": "YARA rule content..."
  }
]`}
                </pre>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-500/20 border border-red-500/40 rounded-lg">
                  <p className="text-red-300 text-xs">{error}</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-6 border-t theme-border theme-bg-subtle">
            <div className="flex items-center justify-between">
              <div className="text-white/70 text-sm">
                {selectedRules.size} built-in rules selected
                {customRules.length > 0 && `, ${customRules.length} custom rules uploaded`}
              </div>
              <div className="flex space-x-3">
                <Button
                  onClick={onClose}
                  variant="ghost"
                  className="text-white/70 hover:theme-text hover:bg-gray-100/80 dark:bg-white/10"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleStartScan}
                  disabled={selectedRules.size === 0 && customRules.length === 0}
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 theme-text font-semibold"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Start Custom Scan
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomScanModal;