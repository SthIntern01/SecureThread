// src/pages/WorkspaceCallback.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { githubService } from '../services/githubService';
import { EtherealBackground } from '../components/ui/ethereal-background';
import { IconShield, IconCheck, IconX } from '@tabler/icons-react';

const WorkspaceCallback = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const errorParam = searchParams.get('error');

      if (errorParam) {
        setStatus('error');
        setError(`GitHub authorization failed: ${errorParam}`);
        return;
      }

      if (!code || !state) {
        setStatus('error');
        setError('Missing authorization code or state');
        return;
      }

      try {
        // Process the callback
        const result = await githubService.handleWorkspaceCallback(code, state);
        
        // Store GitHub token temporarily for repository fetching
        sessionStorage.setItem('github_access_token', result.github_token);
        
        setStatus('success');
        
        // Redirect to repository selection
        setTimeout(() => {
          navigate('/workspace/select-repositories', { replace: true });
        }, 1500);
      } catch (err: any) {
        console.error('Workspace callback error:', err);
        setStatus('error');
        setError(err.message || 'Failed to process authorization');
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center p-4">
      <EtherealBackground
        color="rgba(255, 255, 255, 0.6)"
        animation={{ scale: 100, speed: 90 }}
        noise={{ opacity: 0.8, scale: 1.2 }}
        sizing="fill"
      />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <IconShield className="h-8 w-8 text-white" />
            <span className="text-2xl font-bold text-white">SECURE THREAD</span>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
          <div className="text-center">
            {status === 'loading' && (
              <>
                <div className="w-16 h-16 mx-auto mb-4">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-accent"></div>
                </div>
                <h2 className="text-xl font-semibold text-brand-black mb-2">
                  Authorizing GitHub Access...
                </h2>
                <p className="text-brand-gray text-sm">
                  Please wait while we set up your workspace.
                </p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                  <IconCheck className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-brand-black mb-2">
                  Authorization Successful!
                </h2>
                <p className="text-brand-gray text-sm">
                  Redirecting to repository selection...
                </p>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                  <IconX className="h-8 w-8 text-red-600" />
                </div>
                <h2 className="text-xl font-semibold text-brand-black mb-2">
                  Authorization Failed
                </h2>
                <p className="text-brand-gray text-sm mb-4">{error}</p>
                <button
                  onClick={() => navigate('/workspace/create')}
                  className="bg-accent hover:bg-accent/90 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Try Again
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceCallback;