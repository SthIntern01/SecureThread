import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { WorkspaceProvider } from "./contexts/WorkspaceContext"; 
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Dashboard from "./pages/DashboardPage";
import Projects from "./pages/Projects";
import Integrations from "./pages/Integrations";
import Docs from "./pages/Docs"; 
import Solved from "./pages/Solved";
import AIChat from "./pages/AIChat";
import SignIn from "./pages/SignIn";
import Settings from "./pages/Settings";
import SignUp from "./pages/SignUp";
import Feedback from "./pages/Feedback"; 
import Help from "./pages/Help";
import GitHubCallback from "./pages/GitHubCallback";
import GitLabCallback from "./pages/GitLabCallback";
import BitbucketCallback from "./pages/BitbucketCallback";
import NotFound from "./pages/NotFound";
import RepositoryDetailsPage from "./pages/RepositoryDetails";
import InviteAccept from "./pages/InviteAccept";
import WorkspaceSettings from "./pages/WorkspaceSettings";
import CreateWorkspace from "./pages/CreateWorkspace"; 
import Profile from "./pages/Profile";
import WorkspaceCallback from './pages/WorkspaceCallback';
import SelectRepositories from './pages/SelectRepositories';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <WorkspaceProvider> {/* ADD THIS WRAPPER */}
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/signin" element={<SignIn />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/auth/github/callback" element={<GitHubCallback />} />
              <Route path="/auth/gitlab/callback" element={<GitLabCallback />} />
              <Route path="/auth/bitbucket/callback" element={<BitbucketCallback />} />
              <Route path="/docs" element={<Docs />} />
              <Route path="/accept-invite" element={<InviteAccept />} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/workspace/create" element={<CreateWorkspace />} />
              <Route path="/workspace/callback" element={<WorkspaceCallback />} />
              <Route path="/workspace/select-repositories" element={<SelectRepositories />} />

              {/* Protected routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects"
                element={
                  <ProtectedRoute>
                    <Projects />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects/:projectId"
                element={
                  <ProtectedRoute>
                    <RepositoryDetailsPage />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/integrations"
                element={
                  <ProtectedRoute>
                    <Integrations />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ai-chat"
                element={
                  <ProtectedRoute>
                    <AIChat />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/solved"
                element={
                  <ProtectedRoute>
                    <Solved />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/feedback"
                element={
                  <ProtectedRoute>
                    <Feedback />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/help"
                element={
                  <ProtectedRoute>
                    <Help />
                  </ProtectedRoute>
                }
              />
              {/* ADD THESE WORKSPACE ROUTES */}
              <Route
                path="/workspace/settings"
                element={
                  <ProtectedRoute>
                    <WorkspaceSettings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/workspace/create"
                element={
                  <ProtectedRoute>
                    <CreateWorkspace />
                  </ProtectedRoute>
                }
              />

              {/* Catch all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </WorkspaceProvider> {/* CLOSE THE WRAPPER */}
    </AuthProvider>
  </QueryClientProvider>
);

export default App;