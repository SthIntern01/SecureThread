// src/contexts/WorkspaceContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { workspaceService } from '../services/workspaceService';
import { useAuth } from './AuthContext';

interface Workspace {
  id: string;
  name: string;
  created_at: string | null;
  repository_count: number;
  member_count?: number;
  owner_id?: number;
}

interface WorkspaceContextType {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  loading: boolean;
  refreshWorkspaces: () => Promise<void>;
  switchWorkspace: (workspaceId: string) => Promise<void>;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
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
  const [currentWorkspace, setCurrentWorkspaceState] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  // Wrapper to also save to localStorage when setting workspace
  const setCurrentWorkspace = (workspace: Workspace | null) => {
    console.log('💾 Setting current workspace:', workspace);
    setCurrentWorkspaceState(workspace);
    if (workspace) {
      try {
        localStorage.setItem('currentWorkspace', JSON.stringify(workspace));
      } catch (e) {
        console.error('Failed to save workspace to localStorage:', e);
      }
    } else {
      localStorage.removeItem('currentWorkspace');
    }
  };

  const refreshWorkspaces = async () => {
    try {
      console.log('🔄 Refreshing workspaces...');
      
      // ✅ FIX: Destructure both workspaces AND the activeWorkspaceId from the backend
      const { workspaces: fetchedWorkspaces, activeWorkspaceId } = await workspaceService.getUserWorkspaces();
      console.log('📦 Workspaces fetched:', fetchedWorkspaces);
      
      if (!fetchedWorkspaces || fetchedWorkspaces.length === 0) {
        console.log('⚠️ No workspaces found');
        setWorkspaces([]);
        setCurrentWorkspace(null);
        return;
      }

      setWorkspaces(fetchedWorkspaces);
      
      // ✅ Priority 1: Check if we're switching to a specific workspace (after invitation)
      const switchToId = sessionStorage.getItem('switch_to_workspace');
      if (switchToId) {
        console.log('🔀 Looking for workspace to switch to:', switchToId);
        const targetWorkspace = fetchedWorkspaces.find(w => w.id.toString() === switchToId.toString());
        if (targetWorkspace) {
          console.log('✅ Found target workspace, switching:', targetWorkspace);
          setCurrentWorkspace(targetWorkspace);
          sessionStorage.removeItem('switch_to_workspace');
          return;
        } else {
          console.log('⚠️ Target workspace not found in list');
        }
      }

      // ✅ Priority 2: Trust the backend's active workspace!
      if (activeWorkspaceId) {
        const activeBackendWorkspace = fetchedWorkspaces.find(w => w.id.toString() === activeWorkspaceId.toString());
        if (activeBackendWorkspace) {
          console.log('✅ Using backend active workspace:', activeBackendWorkspace);
          setCurrentWorkspace(activeBackendWorkspace);
          return;
        }
      }
      
      // ✅ Priority 3: Try to restore from localStorage (Fallback only)
      const savedWorkspace = localStorage.getItem('currentWorkspace');
      if (savedWorkspace) {
        try {
          const parsed = JSON.parse(savedWorkspace);
          const exists = fetchedWorkspaces.find(w => w.id.toString() === parsed.id.toString());
          if (exists) {
            console.log('✅ Restored workspace from localStorage:', exists);
            setCurrentWorkspace(exists);
            return;
          } else {
            console.log('⚠️ Saved workspace not found in current list');
          }
        } catch (e) {
          console.log('⚠️ Failed to parse saved workspace');
        }
      }
      
      // ✅ Priority 4: Set the first workspace as active if nothing else matches
      console.log('✅ Setting first workspace as active:', fetchedWorkspaces[0]);
      setCurrentWorkspace(fetchedWorkspaces[0]);
      
    } catch (error) {
      console.error('❌ Error refreshing workspaces:', error);
      setWorkspaces([]);
      setCurrentWorkspace(null);
    }
  };

  const switchWorkspace = async (workspaceId: string) => {
    try {
      console.log('🔀 Switching workspace to:', workspaceId);
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        console.error('No access token found');
        return;
      }

      const response = await fetch(`${API_URL}/api/v1/workspace/switch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ workspace_id: workspaceId }),
      });

      if (response.ok) {
        // ✅ FIX: Clear local storage so it doesn't immediately fight the backend on refresh
        localStorage.removeItem('currentWorkspace');
        
        await refreshWorkspaces();
        console.log('✅ Workspace switched successfully');
      } else {
        throw new Error('Failed to switch workspace');
      }
    } catch (error) {
      console.error('❌ Error switching workspace:', error);
      throw error;
    }
  };

  // ✅ Load workspaces when user is authenticated
  useEffect(() => {
    const loadWorkspaces = async () => {
      if (!isAuthenticated) {
        console.log('⚠️ User not authenticated, skipping workspace load');
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('access_token');
      if (!token) {
        console.log('⚠️ No access token found');
        setLoading(false);
        return;
      }

      console.log('👤 User authenticated, loading workspaces...');
      setLoading(true);
      
      try {
        await refreshWorkspaces();
        
        // ✅ Check if we need to switch to a newly joined workspace
        const switchToWorkspace = sessionStorage.getItem('switch_to_workspace');
        if (switchToWorkspace) {
          console.log('🔀 Pending workspace switch detected, refreshing again...');
          // Give it a moment for backend to fully commit
          setTimeout(async () => {
            await refreshWorkspaces();
          }, 500);
        }
      } catch (error) {
        console.error('❌ Error loading workspaces:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWorkspaces();
  }, [isAuthenticated]); // Re-run when authentication status changes

  // ✅ Debug log when workspace changes
  useEffect(() => {
    console.log('📍 Current workspace updated:', currentWorkspace);
  }, [currentWorkspace]);

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        currentWorkspace,
        loading,
        refreshWorkspaces,
        switchWorkspace,
        setCurrentWorkspace,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};