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
  X,
  Settings,
  Brain,
  Lock,
  Code,
  Maximize2,
  Minimize2
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

interface ScanMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUnifiedScan: (config: any) => void;
  projectName?: string;
}

// Enhanced JSON Editor Modal Component
const JsonEditorModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  isValid: boolean;
  validRulesCount: number;
  error: string;
}> = ({ isOpen, onClose, value, onChange, onSave, isValid, validRulesCount, error }) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleSave = () => {
    onChange(localValue);
    onSave();
    onClose();
  };

  const handleCancel = () => {
    setLocalValue(value); // Reset to original value
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white mb-2 flex items-center justify-between">
              <div className="flex items-center">
                <Code className="w-5 h-5 mr-2 text-orange-400" />
                JSON Rules Editor
              </div>
              <div className="flex items-center space-x-2">
                {localValue && (
                  <div className="flex items-center space-x-2 text-sm">
                    {isValid ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                        <span className="text-green-400">{validRulesCount} valid rules</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 text-yellow-400" />
                        <span className="text-yellow-400">Invalid JSON</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </DialogTitle>
            <p className="text-white/70 text-sm">
              Edit your custom security rules in JSON format. Changes are saved when you click "Save & Close".
            </p>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="flex-1 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[60vh]">
            {/* JSON Editor */}
            <div className="lg:col-span-2 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-white">Custom Rules JSON</label>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => setLocalValue("")}
                    size="sm"
                    variant="ghost"
                    className="text-white/60 hover:text-white hover:bg-white/10 text-xs"
                  >
                    Clear All
                  </Button>
                </div>
              </div>
              <div className="relative flex-1">
                <textarea
                  value={localValue}
                  onChange={(e) => setLocalValue(e.target.value)}
                  placeholder="Enter your JSON rules here..."
                  className="w-full h-full p-4 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none font-mono leading-relaxed"
                  spellCheck={false}
                />
                {localValue && (
                  <button
                    onClick={() => setLocalValue("")}
                    className="absolute top-3 right-3 text-red-400 hover:text-red-300 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Reference Panel */}
            <div className="flex flex-col">
              <h4 className="text-sm font-medium text-white mb-3">JSON Format Reference</h4>
              <div className="flex-1 bg-white/5 rounded-lg p-4 border border-white/10 overflow-y-auto">
                <pre className="text-white/80 text-xs leading-relaxed">
{`[
  {
    "name": "SQL Injection Detection",
    "description": "Detects potential SQL injection vulnerabilities",
    "category": "web_vulnerability", 
    "severity": "high",
    "rule_content": "rule sql_injection { strings: $sql1 = /union.*select/i $sql2 = /drop.*table/i condition: any of them }"
  },
  {
    "name": "XSS Pattern Detection",
    "description": "Identifies cross-site scripting patterns",
    "category": "web_vulnerability",
    "severity": "medium", 
    "rule_content": "rule xss_detection { strings: $xss1 = /<script/i $xss2 = /javascript:/i condition: any of them }"
  }
]`}
                </pre>
              </div>

              {/* Field Requirements */}
              <div className="mt-4 bg-white/5 border border-white/10 rounded-lg p-3">
                <h5 className="text-white/80 text-xs font-semibold mb-2">Required Fields:</h5>
                <ul className="text-white/70 text-xs space-y-1">
                  <li>• <code className="bg-white/20 px-1 rounded text-orange-300">name</code> - Rule identifier</li>
                  <li>• <code className="bg-white/20 px-1 rounded text-orange-300">description</code> - Rule purpose</li>
                  <li>• <code className="bg-white/20 px-1 rounded text-orange-300">rule_content</code> - YARA rule</li>
                </ul>
              </div>

              {/* Optional Fields */}
              <div className="mt-3 bg-white/5 border border-white/10 rounded-lg p-3">
                <h5 className="text-white/80 text-xs font-semibold mb-2">Optional Fields:</h5>
                <ul className="text-white/70 text-xs space-y-1">
                  <li>• <code className="bg-white/20 px-1 rounded text-white/60">category</code> - Rule category</li>
                  <li>• <code className="bg-white/20 px-1 rounded text-white/60">severity</code> - critical, high, medium, low</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/40 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5" />
                <div>
                  <p className="text-red-300 text-sm font-medium">Validation Error</p>
                  <p className="text-red-200 text-xs mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-white/5 flex items-center justify-between">
          <div className="text-white/60 text-sm">
            Use the reference panel to understand the required JSON format for custom rules.
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={handleCancel}
              variant="ghost"
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Save & Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Enhanced Frosted Glass Dropdown Component
const GlassDropdown: React.FC<{
  label: string;
  value: string | number;
  options: { value: string | number; label: string }[];
  onChange: (value: string | number) => void;
  icon?: React.ReactNode;
}> = ({ label, value, options, onChange, icon }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-white mb-2">
        {icon && <span className="inline-flex items-center mr-1">{icon}</span>}
        {label}
      </label>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-md text-white text-sm hover:bg-white/15 transition-all duration-200 flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-orange-500/50"
        >
          <span>{options.find(opt => opt.value === value)?.label || value}</span>
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsOpen(false)}
            />
            {/* Enhanced Frosted Glass Dropdown Menu */}
            <div className="absolute top-full left-0 right-0 mt-1 z-20 bg-gray-900/80 backdrop-blur-xl border border-white/30 rounded-md shadow-2xl max-h-60 overflow-y-auto">
              {/* Frosted overlay for extra opacity */}
              <div className="absolute inset-0 bg-black/20 rounded-md"></div>
              <div className="relative z-10">
                {options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left text-white text-sm hover:bg-white/20 transition-colors duration-150 first:rounded-t-md last:rounded-b-md border-b border-white/10 last:border-b-0"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const ScanMethodModal: React.FC<ScanMethodModalProps> = ({
  isOpen,
  onClose,
  onSelectUnifiedScan,
  projectName
}) => {
  const [builtInRules, setBuiltInRules] = useState<Rule[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedRules, setSelectedRules] = useState<Set<number>>(new Set());
  const [jsonInput, setJsonInput] = useState<string>("");
  const [customRules, setCustomRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [jsonValid, setJsonValid] = useState<boolean>(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [showJsonEditor, setShowJsonEditor] = useState(false);
  const [scanConfig, setScanConfig] = useState({
    enableLLMEnhancement: true,
    maxFilesToScan: 100,
    scanPriority: 'comprehensive'
  });

  useEffect(() => {
    if (isOpen) {
      fetchBuiltInRules();
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

  const handleJsonInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    setJsonInput(value);
    validateJson(value);
  };

  const validateJson = (value: string) => {
    // Clear previous errors
    setError("");
    
    // If input is empty, clear everything
    if (!value.trim()) {
      setCustomRules([]);
      setJsonValid(false);
      return;
    }

    try {
      const jsonData = JSON.parse(value);
      
      // Validate JSON structure
      if (!Array.isArray(jsonData)) {
        setError("JSON must be an array of rule objects");
        setJsonValid(false);
        setCustomRules([]);
        return;
      }

      if (jsonData.length === 0) {
        setError("JSON array cannot be empty");
        setJsonValid(false);
        setCustomRules([]);
        return;
      }

      // Validate each rule has required fields
      const validRules = [];
      const invalidRules = [];

      for (let i = 0; i < jsonData.length; i++) {
        const rule = jsonData[i];
        if (rule && 
            typeof rule === 'object' && 
            rule.name && 
            rule.description && 
            rule.rule_content) {
          validRules.push(rule);
        } else {
          invalidRules.push(i + 1);
        }
      }

      if (validRules.length === 0) {
        setError("No valid rules found. Each rule must have 'name', 'description', and 'rule_content' fields");
        setJsonValid(false);
        setCustomRules([]);
        return;
      }

      setCustomRules(validRules);
      setJsonValid(true);
      
      if (invalidRules.length > 0) {
        setError(`${invalidRules.length} invalid rules were skipped (rules at positions: ${invalidRules.join(', ')})`);
      }

    } catch (err) {
      setError("Invalid JSON format. Please check your syntax.");
      setJsonValid(false);
      setCustomRules([]);
    }
  };

  const clearJsonInput = () => {
    setJsonInput("");
    setCustomRules([]);
    setError("");
    setJsonValid(false);
  };

  const handleJsonEditorSave = () => {
    validateJson(jsonInput);
  };

  const handleStartScan = () => {
    if (selectedRules.size === 0 && customRules.length === 0) {
      setError("Please select at least one rule or add custom rules");
      return;
    }

    const config = {
      selectedRules: Array.from(selectedRules),
      customRules: customRules.length > 0 ? customRules : null,
      enableLLMEnhancement: scanConfig.enableLLMEnhancement,
      maxFilesToScan: scanConfig.maxFilesToScan,
      scanPriority: scanConfig.scanPriority,
      scanType: 'unified_llm_rules'
    };

    onSelectUnifiedScan(config);
  };

  const handleQuickStart = () => {
    const config = {
      selectedRules: [1, 2, 3, 4, 5], // Default high-priority rules
      customRules: null,
      enableLLMEnhancement: true,
      maxFilesToScan: 50,
      scanPriority: 'quick',
      scanType: 'unified_llm_rules'
    };

    onSelectUnifiedScan(config);
  };

  // Group rules by category
  const rulesByCategory = builtInRules.reduce((acc, rule) => {
    if (!acc[rule.category]) {
      acc[rule.category] = [];
    }
    acc[rule.category].push(rule);
    return acc;
  }, {} as Record<string, Rule[]>);

  // Dropdown options
  const llmEnhancementOptions = [
    { value: true, label: "Enabled" },
    { value: false, label: "Rules Only" }
  ];

  const maxFilesOptions = [
    { value: 50, label: "50 Files (Quick)" },
    { value: 100, label: "100 Files (Standard)" },
    { value: 200, label: "200 Files (Thorough)" }
  ];

  const priorityOptions = [
    { value: 'quick', label: "Quick" },
    { value: 'comprehensive', label: "Comprehensive" },
    { value: 'thorough', label: "Thorough" }
  ];

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[85vh] p-0 overflow-hidden bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl">
          {/* Custom Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 w-8 h-8 rounded-full bg-gray-100/80 dark:bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 flex items-center justify-center text-white/70 hover:theme-text transition-all duration-200 group"
          >
            <X className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </button>

          <div className="flex flex-col h-[85vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/10">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-white mb-2 flex items-center">
                  <Brain className="w-6 h-6 mr-3 text-orange-400" />
                  Custom LLM Engine Security Scan
                </DialogTitle>
                <p className="text-white/70">
                  Advanced security scanning with rule-based detection and AI-powered analysis
                  {projectName && (
                    <span className="block text-sm mt-1 text-white/50">
                      for {projectName}
                    </span>
                  )}
                </p>
              </DialogHeader>
            </div>

            {/* Quick Actions */}
            <div className="px-6 py-4 bg-white/5 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Quick Actions</h3>
                  <p className="text-white/60 text-sm">Start immediately or customize your scan</p>
                </div>
                <div className="flex space-x-3">
                  <Button
                    onClick={handleQuickStart}
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Quick Start
                  </Button>
                  <Button
                    onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                    variant="outline"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    {showAdvancedOptions ? 'Hide' : 'Show'} Options
                  </Button>
                </div>
              </div>
            </div>

            {/* Advanced Options with Enhanced Frosted Glass Dropdowns */}
            {showAdvancedOptions && (
              <div className="px-6 py-4 bg-white/3 border-b border-white/10">
                <div className="grid grid-cols-3 gap-4">
                  <GlassDropdown
                    label="LLM Enhancement"
                    value={scanConfig.enableLLMEnhancement}
                    options={llmEnhancementOptions}
                    onChange={(value) => setScanConfig({
                      ...scanConfig,
                      enableLLMEnhancement: value as boolean
                    })}
                    icon={<Lock className="w-4 h-4" />}
                  />
                  
                  <GlassDropdown
                    label="Max Files"
                    value={scanConfig.maxFilesToScan}
                    options={maxFilesOptions}
                    onChange={(value) => setScanConfig({
                      ...scanConfig,
                      maxFilesToScan: value as number
                    })}
                  />
                  
                  <GlassDropdown
                    label="Priority"
                    value={scanConfig.scanPriority}
                    options={priorityOptions}
                    onChange={(value) => setScanConfig({
                      ...scanConfig,
                      scanPriority: value as string
                    })}
                  />
                </div>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-hidden flex">
              {/* Rules Panel */}
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                    <Shield className="w-5 h-5 mr-2 text-orange-400" />
                    Security Rules ({selectedRules.size} selected)
                  </h3>

                  {loading ? (
                    <div className="text-center py-6">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-400 mx-auto mb-3"></div>
                      <p className="text-white/70 text-sm">Loading rules...</p>
                    </div>
                  ) : error && builtInRules.length === 0 ? (
                    <div className="text-center py-6">
                      <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
                      <p className="text-red-400 mb-3 text-sm">{error}</p>
                      <Button
                        onClick={fetchBuiltInRules}
                        variant="outline"
                        size="sm"
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                      >
                        Try Again
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {Object.entries(rulesByCategory).map(([category, rules]) => (
                        <div key={category} className="bg-white/5 rounded-lg border border-white/10">
                          {/* Category Header */}
                          <button
                            onClick={() => toggleCategory(category)}
                            className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors rounded-t-lg"
                          >
                            <div className="flex items-center space-x-2">
                              {getCategoryIcon(category)}
                              <span className="text-white font-medium text-sm">
                                {getCategoryLabel(category)}
                              </span>
                              <Badge className="bg-orange-500 text-white text-xs">
                                {rules.length}
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
                            <div className="border-t border-white/10">
                              {rules.map((rule) => (
                                <div
                                  key={rule.id}
                                  className="p-3 border-b border-white/5 last:border-b-0 hover:bg-white/5 transition-colors"
                                >
                                  <div className="flex items-start space-x-2">
                                    <input
                                      type="checkbox"
                                      id={`rule-${rule.id}`}
                                      checked={selectedRules.has(rule.id)}
                                      onChange={() => toggleRule(rule.id)}
                                      className="mt-1 w-4 h-4 text-orange-500 bg-white/10 border-white/30 rounded focus:ring-orange-500 focus:ring-2"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center space-x-2 mb-1">
                                        <label
                                          htmlFor={`rule-${rule.id}`}
                                          className="text-sm font-medium text-white cursor-pointer"
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

              {/* Custom Rules Panel - UPDATED WITH EXPANDABLE EDITOR */}
              <div className="w-72 p-4 border-l border-white/10 bg-white/3">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <Code className="w-5 h-5 mr-2 text-orange-400" />
                  Custom Rules
                </h3>

                {/* JSON Input Area with Expand Button */}
                <div className="mb-4">
                  <div className="relative">
                    <textarea
                      value={jsonInput}
                      onChange={handleJsonInputChange}
                      placeholder="Enter JSON rules here..."
                      className="w-full h-32 p-3 pr-10 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none font-mono"
                    />
                    <div className="absolute top-2 right-2 flex items-center space-x-1">
                      {jsonInput && (
                        <button
                          onClick={clearJsonInput}
                          className="text-red-400 hover:text-red-300 transition-colors p-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        onClick={() => setShowJsonEditor(true)}
                        className="text-orange-400 hover:text-orange-300 transition-colors p-1 bg-white/10 rounded hover:bg-white/20"
                        title="Open expanded editor"
                      >
                        <Maximize2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Status indicator */}
                  {jsonInput && (
                    <div className="mt-2 flex items-center space-x-2">
                      {jsonValid ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                          <span className="text-white/70 text-xs">
                            {customRules.length} custom rules loaded
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-4 h-4 text-yellow-400" />
                          <span className="text-white/70 text-xs">
                            Invalid JSON format
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* JSON Format Example */}
                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <h4 className="text-white text-sm font-medium mb-2">JSON Format:</h4>
                  <pre className="text-white/60 text-xs overflow-x-auto">
{`[{
  "name": "Rule Name",
  "description": "Description",
  "category": "web_vulnerability",
  "severity": "high",
  "rule_content": "YARA rule..."
}]`}
                  </pre>
                </div>

                {error && (
                  <div className="mt-3 p-2 bg-red-500/20 border border-red-500/40 rounded-lg">
                    <p className="text-red-300 text-xs">{error}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/10 bg-white/5">
              <div className="flex items-center justify-between">
                <div className="text-white/70 text-sm">
                  {selectedRules.size} built-in rules selected
                  {customRules.length > 0 && `, ${customRules.length} custom rules added`}
                </div>
                <div className="flex space-x-3">
                  <Button
                    onClick={onClose}
                    variant="ghost"
                    className="text-white/70 hover:text-white hover:bg-white/10"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleStartScan}
                    disabled={selectedRules.size === 0 && customRules.length === 0}
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Start Security Scan
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* JSON Editor Modal */}
      <JsonEditorModal
        isOpen={showJsonEditor}
        onClose={() => setShowJsonEditor(false)}
        value={jsonInput}
        onChange={setJsonInput}
        onSave={handleJsonEditorSave}
        isValid={jsonValid}
        validRulesCount={customRules.length}
        error={error}
      />
    </>
  );
};

export default ScanMethodModal;