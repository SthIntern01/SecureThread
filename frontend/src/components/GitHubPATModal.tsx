// frontend/src/components/GitHubPATModal.tsx - COMPLETE FILE

import React, { useState, useEffect } from 'react';
import { X, Github, ExternalLink, CheckCircle2, AlertCircle, Loader2, Trash2 } from 'lucide-react';
import { githubIntegrationService } from '../services/githubIntegrationService';

interface GitHubPATModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const GitHubPATModal: React.FC<GitHubPATModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasExistingToken, setHasExistingToken] = useState(false);
  const [existingTokenInfo, setExistingTokenInfo] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      checkExistingToken();
    }
  }, [isOpen]);

  const checkExistingToken = async () => {
    try {
      const status = await githubIntegrationService.checkPATStatus();
      setHasExistingToken(status.has_token);
      setExistingTokenInfo(status);
    } catch (err) {
      console.error('Error checking PAT status:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const response = await githubIntegrationService.savePATToken(token);
      
      if (response.success) {
        setSuccess(`Token saved successfully! Connected as @${response.github_username}`);
        setToken('');
        setHasExistingToken(true);
        
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 2000);
      } else {
        setError('Failed to save token. Please try again.');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Invalid token or network error';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // FIXED: Removed space between service object and method
      const response = await githubIntegrationService.deletePATToken();
      
      if (response.success) {
        setSuccess('Token deleted successfully');
        setHasExistingToken(false);
        setShowDeleteConfirm(false);
        
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      // FIXED: Removed space in 'err.response?.data?.detail'
      setError(err.response?.data?.detail || 'Failed to delete token');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-900 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <Github className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                GitHub Personal Access Token
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Required to create pull requests
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Existing Token Info */}
          {/* FIXED: Removed space in !showDeleteConfirm */}
          {hasExistingToken && !showDeleteConfirm && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                <div className="flex-1">
                  {/* FIXED: Removed space in dark:text-green-100 */}
                  <h3 className="font-medium text-green-900 dark:text-green-100">
                    Token Connected
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    {/* FIXED: Removed space in existingTokenInfo properties */}
                    Added on {existingTokenInfo?.created_at ? new Date(existingTokenInfo.created_at).toLocaleDateString() : 'N/A'}
                  </p>
                  {existingTokenInfo?.is_valid === false && (
                    <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                      ⚠️ Token may be invalid or expired. Please update it.
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  // FIXED: Removed space in dark:hover:text-red-300
                  className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                  title="Delete token"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Delete Confirmation */}
          {showDeleteConfirm && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-red-900 dark:text-red-100">
                    Delete GitHub Token? 
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    You won't be able to create pull requests until you add a new token.
                  </p>
                  <div className="flex gap-3 mt-3">
                    <button
                      onClick={handleDelete}
                      disabled={isLoading}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
                    >
                      {isLoading ? 'Deleting...' : 'Yes, Delete'}
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      // FIXED: Removed space in hover:bg-gray-600
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* How to Get Token */}
          {/* FIXED: Removed space in dark:bg-blue-900/20 */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-3">
              📝 How to create a Personal Access Token
            </h3>
            <ol className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <li>1. Go to GitHub → Settings → Developer Settings → Personal Access Tokens → Tokens (classic)</li>
              <li>2. Click "Generate new token (classic)"</li>
              <li>3. Give it a name (e.g., "SecureThread VMS")</li>
              <li>4. Select scopes: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">repo</code> (full control)</li>
              <li>5. Click "Generate token" and copy it</li>
            </ol>
            <a
              href="https://github.com/settings/tokens/new"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-3 text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
            >
              Create Token on GitHub
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          {/* Token Input Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              {/* FIXED: Removed space in dark:text-gray-300 */}
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                GitHub Personal Access Token
              </label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400"
                required
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Your token is encrypted and stored securely. We never share it.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={isLoading || !token}
                className="flex-1 px-6 py-3 bg-gray-900 dark:bg-blue-600 text-white rounded-lg hover:bg-gray-800 dark:hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Validating...
                  </>
                ) : (
                  <>
                    <Github className="w-5 h-5" />
                    {hasExistingToken ? 'Update Token' : 'Save Token'}
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                // FIXED: Removed space in hover:bg-gray-600
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};