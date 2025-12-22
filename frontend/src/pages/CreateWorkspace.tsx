// src/pages/CreateWorkspace.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { EtherealBackground } from '../components/ui/ethereal-background';
import AppSidebar from '@/components/AppSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Building2, 
  Github, 
  AlertCircle, 
  ArrowRight,
  Loader2
} from 'lucide-react';

const CreateWorkspace = () => {
  const navigate = useNavigate();
  const { currentWorkspace } = useWorkspace();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');
  const [error, setError] = useState('');

  const handleCreateWorkspace = () => {
    if (!workspaceName.trim()) {
      setError('Please enter a workspace name');
      return;
    }

    // Store workspace name temporarily
    sessionStorage.setItem('pending_workspace_name', workspaceName);
    
    // Navigate to repository selection
    navigate('/workspace/select-repositories');
  };

  return (
    <div className="w-full h-screen font-sans relative flex overflow-hidden">
      <EtherealBackground
        color="rgba(255, 255, 255, 0.6)"
        animation={{ scale: 100, speed: 90 }}
        noise={{ opacity: 0.8, scale: 1.2 }}
        sizing="fill"
      />

      <AppSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 overflow-y-auto overflow-x-hidden relative z-10">
        <div className="p-4 lg:p-6">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl lg:text-4xl font-bold theme-text mb-2">
                Create New Workspace
              </h1>
              <p className="theme-text-secondary">
                Set up a new workspace to organize and scan your repositories
              </p>
            </div>

            {error && (
              <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-400 mb-1">Error</h4>
                  <p className="theme-text-secondary text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Main Card */}
            <div className="bg-gray-100/80 dark:bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
              <div className="p-8">
                {/* Icon */}
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-accent to-accent/80 rounded-2xl flex items-center justify-center shadow-xl">
                    <Building2 className="w-10 h-10 theme-text" />
                  </div>
                </div>

                {/* Form */}
                <div className="space-y-6">
                  <div>
                    <label className="block theme-text font-semibold mb-2">
                      Workspace Name
                    </label>
                    <Input
                      placeholder="e.g., Production Projects, Personal Repos"
                      value={workspaceName}
                      onChange={(e) => {
                        setWorkspaceName(e.target.value);
                        setError('');
                      }}
                      className="bg-gray-100/80 dark:bg-white/10 border-white/20 theme-text placeholder:text-white/50 text-lg py-6"
                      autoFocus
                    />
                    <p className="theme-text-muted text-sm mt-2">
                      Choose a descriptive name for your workspace
                    </p>
                  </div>

                  {/* Info Box */}
                  <div className="theme-bg-subtle border theme-border rounded-xl p-4">
                    <div className="flex items-start space-x-3">
                      <Github className="w-5 h-5 text-white/70 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="theme-text font-semibold mb-1">Next Step</h4>
                        <p className="text-white/70 text-sm">
                          After creating your workspace, you'll select which GitHub repositories to scan for security vulnerabilities.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 theme-bg-subtle border-t theme-border flex justify-between items-center">
                <Button
                  variant="outline"
                  onClick={() => navigate('/')}
                  className="border-white/20 theme-text hover:bg-gray-100/80 dark:bg-white/10"
                >
                  Cancel
                </Button>
                
                <Button
                  onClick={handleCreateWorkspace}
                  disabled={!workspaceName.trim()}
                  className="bg-accent hover:bg-accent/90"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>

            {/* Current Workspace Info (if exists) */}
            {currentWorkspace && (
              <div className="mt-6 text-center">
                <p className="theme-text-muted text-sm">
                  Currently in: <span className="font-semibold theme-text">{currentWorkspace.name}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateWorkspace;
