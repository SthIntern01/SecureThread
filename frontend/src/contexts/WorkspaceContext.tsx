// src/contexts/WorkspaceContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Workspace {
  id: number;
  name: string;
  created_at: string | null;
  repository_count: number;
}

interface WorkspaceContextType {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null; // Changed from activeWorkspace to currentWorkspace
  loading: boolean;
  refreshWorkspaces: () => Promise<void>;
  switchWorkspace: (workspaceId: number) => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within WorkspaceProvider');
  }
  return context;
};

interface WorkspaceProviderProps {
  children: ReactNode;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const WorkspaceProvider: React.FC<WorkspaceProviderProps> = ({ children }) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWorkspaces = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/v1/workspace/list`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setWorkspaces(data.workspaces);
        
        // Set active workspace
        const active = data.workspaces.find(
          (w: Workspace) => w.id === data.active_workspace_id
        );
        setCurrentWorkspace(active || data.workspaces[0] || null);
      }
    } catch (error) {
      console.error('Error fetching workspaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const switchWorkspace = async (workspaceId: number) => {
    try {
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`${API_URL}/api/v1/workspace/switch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ workspace_id: workspaceId }),
      });

      if (response.ok) {
        await fetchWorkspaces();
      } else {
        throw new Error('Failed to switch workspace');
      }
    } catch (error) {
      console.error('Error switching workspace:', error);
      throw error;
    }
  };

  const refreshWorkspaces = async () => {
    await fetchWorkspaces();
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        currentWorkspace,
        loading,
        refreshWorkspaces,
        switchWorkspace,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};