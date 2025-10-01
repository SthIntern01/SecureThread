import React, { createContext, useContext, useState, useEffect } from 'react';
import { workspaceService, Workspace } from '../services/workspaceService';

interface WorkspaceContextType {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  loading: boolean;
  switchWorkspace: (workspaceId: string) => Promise<void>;
  refreshWorkspaces: () => Promise<void>;
  createWorkspace: (name: string) => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
    try {
      setLoading(true);
      const allWorkspaces = await workspaceService.getUserWorkspaces();
      setWorkspaces(allWorkspaces);

      const currentId = workspaceService.getCurrentWorkspaceId();
      if (currentId) {
        const current = allWorkspaces.find(w => w.id === currentId);
        setCurrentWorkspace(current || allWorkspaces[0] || null);
      } else if (allWorkspaces.length > 0) {
        setCurrentWorkspace(allWorkspaces[0]);
        localStorage.setItem('current_workspace_id', allWorkspaces[0].id);
      }
    } catch (error) {
      console.error('Error loading workspaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const switchWorkspace = async (workspaceId: string) => {
    try {
      await workspaceService.switchWorkspace(workspaceId);
      const workspace = workspaces.find(w => w.id === workspaceId);
      if (workspace) {
        setCurrentWorkspace(workspace);
      }
    } catch (error) {
      console.error('Error switching workspace:', error);
      throw error;
    }
  };

  const refreshWorkspaces = async () => {
    await loadWorkspaces();
  };

  const createWorkspace = async (name: string) => {
    const redirectUri = `${window.location.origin}/workspace/callback`;
    const state = encodeURIComponent(JSON.stringify({ name, action: 'create_workspace' }));
    
    sessionStorage.setItem('pending_workspace_name', name);
    
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${process.env.REACT_APP_GITHUB_CLIENT_ID}&redirect_uri=${redirectUri}&scope=repo&state=${state}`;
  };

  return (
    <WorkspaceContext.Provider
      value={{
        currentWorkspace,
        workspaces,
        loading,
        switchWorkspace,
        refreshWorkspaces,
        createWorkspace,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};