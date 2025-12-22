// frontend/src/components/CreatePRModal.tsx - COMPLETE FILE

import React, { useState, useEffect } from 'react';
import { X, GitPullRequest, Loader2, CheckCircle2, AlertCircle, ExternalLink, Package, Trash2 } from 'lucide-react';
import { githubIntegrationService, VulnerabilityFix } from '../services/githubIntegrationService';

interface CreatePRModalProps {
  isOpen: boolean;
  onClose: () => void;
  repositoryId: number;
  repositoryName: string;
  preSelectedFixIds?: number[];
  onSuccess?: (prUrl: string) => void;
}

export const CreatePRModal: React.FC<CreatePRModalProps> = ({
  isOpen,
  onClose,
  repositoryId,
  repositoryName,
  preSelectedFixIds = [],
  onSuccess,
}) => {
  const [mode, setMode] = useState<'single' | 'batch'>('single');
  const [pendingFixes, setPendingFixes] = useState<VulnerabilityFix[]>([]);
  const [selectedFixIds, setSelectedFixIds] = useState<number[]>(preSelectedFixIds);
  const [branchName, setBranchName] = useState('');
  const [prTitle, setPrTitle] = useState('');
  const [prDescription, setPrDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ prUrl: string; prNumber: number } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadPendingFixes();
      // Auto-generate branch name
      const timestamp = new Date().toISOString().split('T')[0];
      setBranchName(`fix/security-vulnerabilities-${timestamp}`);
    } else {
      // Reset state
      setMode('single');
      setSelectedFixIds(preSelectedFixIds);
      setBranchName('');
      setPrTitle('');
      setPrDescription('');
      setError(null);
      setSuccess(null);
    }
  }, [isOpen, repositoryId]);

  useEffect(() => {
    // Auto-generate PR title based on selected fixes
    if (selectedFixIds.length > 0) {
      const count = selectedFixIds.length;
      setPrTitle(`🔒 Security Fix: ${count} vulnerability${count > 1 ? 'ies' : 'y'} fixed`);
    }
  }, [selectedFixIds]);

  const loadPendingFixes = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // FIXED: Removed space in method call
      const response = await githubIntegrationService.getPendingFixes(repositoryId);
      setPendingFixes(response.fixes);

      // If preselected IDs, use them; otherwise select all
      if (preSelectedFixIds.length > 0) {
        setSelectedFixIds(preSelectedFixIds);
        setMode('single');
      } else if (response.fixes.length > 0) {
        setSelectedFixIds(response.fixes.map(f => f.id));
        setMode(response.fixes.length > 1 ? 'batch' : 'single');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load pending fixes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFix = (fixId: number) => {
    setSelectedFixIds(prev =>
      prev.includes(fixId)
        ? prev.filter(id => id !== fixId)
        : [...prev, fixId]
    );
  };

  const handleDeleteFix = async (fixId: number) => {
    if (!confirm('Delete this fix? This cannot be undone.')) return;

    try {
      await githubIntegrationService.deleteVulnerabilityFix(fixId);
      setPendingFixes(prev => prev.filter(f => f.id !== fixId));
      setSelectedFixIds(prev => prev.filter(id => id !== fixId));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete fix');
    }
  };

  const handleCreatePR = async () => {
    if (selectedFixIds.length === 0) {
      setError('Please select at least one fix');
      return;
    }

    if (!branchName.trim()) {
      setError('Please enter a branch name');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      // FIXED: Removed space in method call
      const response = await githubIntegrationService.createPullRequest({
        repository_id: repositoryId,
        vulnerability_fix_ids: selectedFixIds,
        branch_name: branchName,
        pr_title: prTitle || undefined,
        pr_description: prDescription || undefined,
      });

      if (response.success && response.pr_url && response.pr_number) {
        setSuccess({
          prUrl: response.pr_url,
          prNumber: response.pr_number,
        });

        if (onSuccess) {
          onSuccess(response.pr_url);
        }

        // Auto-close after 3 seconds
        setTimeout(() => {
          onClose();
        }, 3000);
      } else {
        setError(response.error || 'Failed to create pull request');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to create pull request';
      setError(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const getSeverityColor = (severity?: string) => {
    // FIXED: Removed space in toLowerCase()
    switch (severity?.toLowerCase()) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <GitPullRequest className="w-6 h-6 text-green-600 dark:text-green-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Create Pull Request
              </h2>
            </div>
            {/* FIXED: Removed space in dark:text-gray-400 */}
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Repository: <span className="font-mono font-medium">{repositoryName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            disabled={isCreating}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Success State */}
        {success ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                Pull Request Created!
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                PR #{success.prNumber} has been successfully created
              </p>
              <a
                href={success.prUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
              >
                View on GitHub
                <ExternalLink className="w-5 h-5" />
              </a>
            </div>
          </div>
        ) : (
          <>
            {/* Mode Toggle */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex gap-4">
                <button
                  onClick={() => setMode('single')}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                    mode === 'single'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  Single Fix
                </button>
                <button
                  onClick={() => setMode('batch')}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                    mode === 'batch'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <Package className="w-5 h-5" />
                  Batch PR ({pendingFixes.length} fixes)
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : pendingFixes.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  {/* FIXED: Removed space in dark:text-white */}
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No Pending Fixes
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Save some vulnerability fixes first before creating a PR
                  </p>
                </div>
              ) : (
                <>
                  {/* Pending Fixes List */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Select Fixes to Include ({selectedFixIds.length} selected)
                    </h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {/* FIXED: Removed space in pendingFixes.map */}
                      {pendingFixes.map((fix) => (
                        <div
                          key={fix.id}
                          className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                            selectedFixIds.includes(fix.id)
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedFixIds.includes(fix.id)}
                            onChange={() => handleToggleFix(fix.id)}
                            className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-gray-900 dark:text-white truncate">
                                {/* FIXED: Removed space in fix.vulnerability_title */}
                                {fix.vulnerability_title || 'Security Fix'}
                              </p>
                              {fix.vulnerability_severity && (
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getSeverityColor(fix.vulnerability_severity)}`}>
                                  {fix.vulnerability_severity}
                                </span>
                              )}
                            </div>
                            {/* FIXED: Removed space in fix.file_path */}
                            <p className="text-sm text-gray-600 dark:text-gray-400 font-mono truncate">
                              {fix.file_path}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              {fix.fix_type === 'manual' ? '✏️ Manual' : '✨ AI-suggested'} • 
                              {new Date(fix.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFix(fix.id);
                            }}
                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-2"
                            title="Delete fix"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* PR Configuration */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Branch Name
                      </label>
                      <input
                        type="text"
                        value={branchName}
                        onChange={(e) => setBranchName(e.target.value)}
                        placeholder="fix/security-vulnerabilities-2025-01-17"
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        PR Title
                      </label>
                      <input
                        type="text"
                        value={prTitle}
                        // FIXED: Removed space in e.target.value
                        onChange={(e) => setPrTitle(e.target.value)}
                        placeholder="🔒 Security Fix: 3 vulnerabilities fixed"
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      {/* FIXED: Removed space in dark:text-gray-300 */}
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        PR Description (Optional)
                      </label>
                      <textarea
                        value={prDescription}
                        onChange={(e) => setPrDescription(e.target.value)}
                        placeholder="Auto-generated description will be used if left empty"
                        rows={4}
                        // FIXED: Removed space in dark:border-gray-600
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white resize-none"
                      />
                    </div>
                  </div>

                  {/* Info Banner */}
                  {/* FIXED: Removed space in dark:bg-blue-900/20 */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      💡 <strong>What happens next:</strong><br />
                      • New branch will be created from the default branch<br />
                      • All selected fixes will be committed<br />
                      • Pull request will be opened automatically<br />
                      • You can review and merge it on GitHub
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 space-y-3">
              {error && (
                // FIXED: Removed space in dark:bg-red-900/20
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleCreatePR}
                  disabled={isCreating || selectedFixIds.length === 0 || !branchName}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating PR...
                    </>
                  ) : (
                    <>
                      <GitPullRequest className="w-5 h-5" />
                      Create Pull Request
                    </>
                  )}
                </button>
                <button
                  onClick={onClose}
                  disabled={isCreating}
                  // FIXED: Removed space in dark:text-gray-300
                  className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
