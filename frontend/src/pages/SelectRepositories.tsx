// src/pages/SelectRepositories.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { githubService, GitHubRepository } from '../services/githubService';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { EtherealBackground } from '../components/ui/ethereal-background';
import AppSidebar from '@/components/AppSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Github, 
  Search, 
  CheckCircle2, 
  Circle,
  ArrowRight,
  AlertCircle,
  Loader2
} from 'lucide-react';

const SelectRepositories = () => {
  const navigate = useNavigate();
  const { refreshWorkspaces } = useWorkspace();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [repositories, setRepositories] = useState<GitHubRepository[]>([]);
  const [selectedRepos, setSelectedRepos] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const workspaceName = sessionStorage.getItem('pending_workspace_name') || 'New Workspace';

  useEffect(() => {
    loadRepositories();
  }, []);

  const loadRepositories = async () => {
    try {
      setLoading(true);
      const repos = await githubService.getUserRepositories();
      setRepositories(repos);
      
      // Pre-select all repositories
      const allIds = new Set(repos.map(r => r.id));
      setSelectedRepos(allIds);
    } catch (err: any) {
      console.error('Error loading repositories:', err);
      setError(err.message || 'Failed to load repositories');
    } finally {
      setLoading(false);
    }
  };

  const toggleRepository = (repoId: number) => {
    const newSelected = new Set(selectedRepos);
    if (newSelected.has(repoId)) {
      newSelected.delete(repoId);
    } else {
      newSelected.add(repoId);
    }
    setSelectedRepos(newSelected);
  };

  const toggleAll = () => {
    if (selectedRepos.size === filteredRepositories.length) {
      setSelectedRepos(new Set());
    } else {
      const allIds = new Set(filteredRepositories.map(r => r.id));
      setSelectedRepos(allIds);
    }
  };

  const filteredRepositories = repositories.filter(repo =>
    repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    repo.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (repo.description && repo.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCreateWorkspace = async () => {
    if (selectedRepos.size === 0) {
      setError('Please select at least one repository');
      return;
    }

    try {
      setCreating(true);
      setError('');

      const result = await githubService.createWorkspaceWithRepos({
        name: workspaceName,
        repository_ids: Array.from(selectedRepos),
      });

      console.log('Workspace created:', result);

      // Clear temporary data
      sessionStorage.removeItem('pending_workspace_name');
      sessionStorage.removeItem('github_access_token');

      // Refresh workspaces to get the new one
      await refreshWorkspaces();

      // Small delay to ensure state is updated
      setTimeout(() => {
        // Navigate to projects page to see the new workspace's repositories
        navigate('/projects', { replace: true });
        // Reload to refresh sidebar with new workspace
        window.location.reload();
      }, 500);

    } catch (err: any) {
      console.error('Error creating workspace:', err);
      setError(err.message || 'Failed to create workspace');
      setCreating(false);
    }
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
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl lg:text-4xl font-bold theme-text mb-2">
                Select Repositories
              </h1>
              <p className="theme-text-secondary">
                Choose which repositories to scan in <span className="font-semibold">{workspaceName}</span>
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

            {/* Main Content */}
            <div className="bg-gray-100/80 dark:bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
              {/* Search and Stats */}
              <div className="p-6 border-b theme-border">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
                  <div className="flex items-center space-x-4 flex-1 min-w-[300px]">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 theme-text-muted" />
                      <Input
                        placeholder="Search repositories..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-gray-100/80 dark:bg-white/10 border-white/20 theme-text placeholder:text-white/50"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="bg-gray-100/80 dark:bg-white/10 rounded-lg px-4 py-2 border border-white/20">
                      <span className="theme-text font-semibold">
                        {selectedRepos.size} selected
                      </span>
                    </div>
                    {filteredRepositories.length > 0 && (
                      <Button
                        onClick={toggleAll}
                        variant="outline"
                        className="border-white/20 theme-text hover:bg-gray-100/80 dark:bg-white/10"
                      >
                        {selectedRepos.size === filteredRepositories.length ? 'Deselect All' : 'Select All'}
                      </Button>
                    )}
                  </div>
                </div>

                <p className="text-white/70 text-sm">
                  We've pre-selected all your repositories. Deselect any you don't want to scan.
                </p>
              </div>

              {/* Repository List */}
              <div className="p-6">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-12 h-12 theme-text animate-spin mb-4" />
                    <p className="theme-text-secondary">Loading your repositories...</p>
                  </div>
                ) : filteredRepositories.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Github className="w-16 h-16 text-white/40 mb-4" />
                    <p className="theme-text-secondary text-lg font-semibold mb-2">
                      {searchQuery ? 'No repositories found' : 'No repositories available'}
                    </p>
                    <p className="theme-text-muted text-sm">
                      {searchQuery ? 'Try a different search term' : 'Create some repositories on GitHub first'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                    {filteredRepositories.map((repo) => {
                      const isSelected = selectedRepos.has(repo.id);
                      
                      return (
                        <button
                          key={repo.id}
                          onClick={() => toggleRepository(repo.id)}
                          className={`w-full flex items-start space-x-4 p-4 rounded-xl border-2 transition-all ${
                            isSelected
                              ? 'bg-accent/20 border-accent shadow-lg'
                              : 'theme-bg-subtle theme-border hover:bg-gray-100/80 dark:bg-white/10'
                          }`}
                        >
                          <div className="flex-shrink-0 mt-0.5">
                            {isSelected ? (
                              <CheckCircle2 className="w-6 h-6 text-accent" />
                            ) : (
                              <Circle className="w-6 h-6 text-white/40" />
                            )}
                          </div>
                          
                          <div className="flex-1 text-left min-w-0">
                            <div className="flex items-center space-x-2 mb-1 flex-wrap">
                              <Github className="w-4 h-4 theme-text-muted flex-shrink-0" />
                              <h3 className="theme-text font-semibold truncate">
                                {repo.name}
                              </h3>
                              {repo.private && (
                                <span className="text-xs bg-gray-100/80 dark:bg-white/10 theme-text-secondary px-2 py-0.5 rounded">
                                  Private
                                </span>
                              )}
                              {repo.language && (
                                <span className="text-xs bg-gray-100/80 dark:bg-white/10 theme-text-secondary px-2 py-0.5 rounded">
                                  {repo.language}
                                </span>
                              )}
                            </div>
                            
                            {repo.description && (
                              <p className="text-white/70 text-sm line-clamp-2">
                                {repo.description}
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="p-6 border-t theme-border flex justify-between items-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    sessionStorage.removeItem('pending_workspace_name');
                    navigate('/workspace/create');
                  }}
                  disabled={creating}
                  className="border-white/20 theme-text hover:bg-gray-100/80 dark:bg-white/10"
                >
                  Back
                </Button>
                
                <Button
                  onClick={handleCreateWorkspace}
                  disabled={selectedRepos.size === 0 || creating}
                  className="bg-accent hover:bg-accent/90"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Workspace...
                    </>
                  ) : (
                    <>
                      Create Workspace & Scan
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectRepositories;
