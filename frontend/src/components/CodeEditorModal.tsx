// frontend/src/components/CodeEditorModal.tsx - COMPLETE FILE

import React, { useState, useEffect, useRef } from 'react';
import { X, Code2, Save, Loader2, CheckCircle2, AlertCircle, Sparkles, Copy, Check } from 'lucide-react';
import { githubIntegrationService } from '../services/githubIntegrationService';

interface CodeEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  vulnerability: {
    id: number;
    title: string;
    severity: string;
    file_path: string;
    line_number?: number;
    code_snippet?: string;
    fix_suggestion?: string;
    repository_id: number;
  };
  onFixSaved?: (fixId: number) => void;
}

export const CodeEditorModal: React.FC<CodeEditorModalProps> = ({
  isOpen,
  onClose,
  vulnerability,
  onFixSaved,
}) => {
  const [activeTab, setActiveTab] = useState<'manual' | 'ai'>('manual');
  const [originalCode, setOriginalCode] = useState('');
  const [fixedCode, setFixedCode] = useState('');
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fileLoaded, setFileLoaded] = useState(false);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadFileContent();
    } else {
      // Reset state when modal closes
      setActiveTab('manual');
      setOriginalCode('');
      setFixedCode('');
      setFileLoaded(false);
      setError(null);
      setSuccess(null);
    }
  }, [isOpen, vulnerability.id]);

  const loadFileContent = async () => {
    setIsLoadingFile(true);
    setError(null);

    try {
      const response = await githubIntegrationService.fetchFileContent({
        repository_id: vulnerability.repository_id,
        file_path: vulnerability.file_path,
      });

      if (response.success && response.content) {
        setOriginalCode(response.content);
        setFixedCode(response.content);
        setFileLoaded(true);
      } else {
        // Fallback to code snippet if file fetch fails
        const fallbackCode = vulnerability.code_snippet || '// File content not available';
        setOriginalCode(fallbackCode);
        setFixedCode(fallbackCode);
        setFileLoaded(true);
        setError(response.error || 'Could not fetch full file. Using code snippet.');
      }
    } catch (err: any) {
      console.error('Error loading file:', err);
      const fallbackCode = vulnerability.code_snippet || '// File content not available';
      setOriginalCode(fallbackCode);
      setFixedCode(fallbackCode);
      setFileLoaded(true);
      setError('Could not connect to GitHub. Using code snippet instead.');
    } finally {
      setIsLoadingFile(false);
    }
  };

  const handleApplyAIFix = () => {
    if (vulnerability.fix_suggestion) {
      setFixedCode(vulnerability.fix_suggestion);
      setActiveTab('manual');
    }
  };

  const handleSaveFix = async () => {
    if (fixedCode.trim() === originalCode.trim()) {
      setError('No changes detected. Please modify the code before saving.');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await githubIntegrationService.saveVulnerabilityFix({
        vulnerability_id: vulnerability.id,
        file_path: vulnerability.file_path,
        original_code: originalCode,
        fixed_code: fixedCode,
        fix_type: activeTab === 'ai' ? 'ai_suggested' : 'manual',
      });

      if (response.success) {
        setSuccess('Fix saved successfully! You can now create a pull request.');
        if (onFixSaved) {
          onFixSaved(response.fix_id);
        }
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to save fix';
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(fixedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': 
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'high': 
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'low':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default: 
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-7xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-3 mb-2">
              <Code2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Fix Vulnerability
              </h2>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSeverityColor(vulnerability.severity)}`}>
                {vulnerability.severity}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{vulnerability.title}</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 font-mono">
              {vulnerability.file_path}
              {vulnerability.line_number && ` : Line ${vulnerability.line_number}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 px-6">
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'manual'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Manual Edit
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'ai'
                ? 'border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            AI Suggestion
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex">
          {isLoadingFile ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Loading file content...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Manual Edit Tab */}
              {activeTab === 'manual' && (
                <div className="flex-1 flex overflow-hidden">
                  {/* Original Code */}
                  <div className="flex-1 flex flex-col border-r border-gray-200 dark:border-gray-700">
                    <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Original Code (Read-only)
                      </h3>
                    </div>
                    <div className="flex-1 overflow-auto p-6">
                      <pre className="text-sm font-mono text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                        {originalCode}
                      </pre>
                    </div>
                  </div>

                  {/* Fixed Code */}
                  <div className="flex-1 flex flex-col">
                    <div className="px-6 py-3 bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800 flex items-center justify-between">
                      <h3 className="text-sm font-medium text-green-800 dark:text-green-300">
                        Your Fix (Editable)
                      </h3>
                      <button
                        onClick={handleCopyCode}
                        className="text-xs flex items-center gap-1 text-green-700 dark:text-green-400 hover:text-green-900 dark:hover:text-green-200"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <div className="flex-1 overflow-auto p-6">
                      <textarea
                        ref={textareaRef}
                        value={fixedCode}
                        onChange={(e) => setFixedCode(e.target.value)}
                        className="w-full h-full min-h-[400px] font-mono text-sm text-gray-800 dark:text-gray-200 bg-transparent border-none focus:outline-none resize-none"
                        spellCheck={false}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* AI Suggestion Tab */}
              {activeTab === 'ai' && (
                <div className="flex-1 flex flex-col p-6 overflow-auto">
                  {vulnerability.fix_suggestion ? (
                    <div className="space-y-4">
                      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                        <div className="flex items-start gap-3 mb-4">
                          <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                          <div>
                            <h3 className="font-medium text-purple-900 dark:text-purple-100">
                              AI-Generated Fix
                            </h3>
                            <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                              Review this suggested fix and apply it to the editor
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={handleApplyAIFix}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
                        >
                          Apply This Fix
                        </button>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                          Suggested Code:
                        </h4>
                        <pre className="text-sm font-mono text-gray-800 dark:text-gray-200 whitespace-pre-wrap bg-white dark:bg-gray-900 p-4 rounded border border-gray-200 dark:border-gray-700">
                          {vulnerability.fix_suggestion}
                        </pre>
                      </div>

                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          💡 <strong>Tip: </strong> Always review AI suggestions carefully before applying. 
                          You can further edit the code in the Manual Edit tab. 
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center max-w-md">
                        <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          No AI Suggestion Available
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          This vulnerability doesn't have an AI-generated fix yet. 
                          Please use the Manual Edit tab to create your fix.
                        </p>
                        <button
                          onClick={() => setActiveTab('manual')}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Go to Manual Edit
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 space-y-3">
          {/* Error/Success Messages */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleSaveFix}
              disabled={isSaving || !fileLoaded || fixedCode === originalCode}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving Fix...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Fix
                </>
              )}
            </button>
            <button
              onClick={onClose}
              disabled={isSaving}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 font-medium transition-colors"
            >
              Cancel
            </button>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            After saving, you can create a pull request from the pending fixes
          </p>
        </div>
      </div>
    </div>
  );
};