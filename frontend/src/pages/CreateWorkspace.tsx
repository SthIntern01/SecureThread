import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EtherealBackground } from "../components/ui/ethereal-background";
import AppSidebar from "@/components/AppSidebar";
import { useWorkspace } from "../contexts/WorkspaceContext";
import {
  ChevronRight,
  Building2,
  Github,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

const CreateWorkspace = () => {
  const navigate = useNavigate();
  const { createWorkspace } = useWorkspace();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");
  const [error, setError] = useState("");

  const handleCreateWorkspace = async () => {
    if (!workspaceName.trim()) {
      setError("Please enter a workspace name");
      return;
    }

    try {
      setError("");
      // This will redirect to GitHub OAuth
      await createWorkspace(workspaceName);
    } catch (error: any) {
      console.error("Error creating workspace:", error);
      setError(error.message || "Failed to create workspace");
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
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="p-8 border-b border-white/10">
                <div className="flex items-center space-x-2 text-sm mb-4">
                  <span className="font-medium text-white">SecureThread</span>
                  <ChevronRight size={16} className="text-white/60" />
                  <span className="font-medium text-white">Create Workspace</span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
                      Create New Workspace
                    </h1>
                    <p className="text-white/80">
                      Choose a name and authorize GitHub access
                    </p>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-accent/20 to-accent/40 rounded-full flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-accent" />
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-8">
                {error && (
                  <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-red-400 mb-1">Error</h4>
                      <p className="text-white/80 text-sm">{error}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
                    <label className="block text-sm font-medium text-white/80 mb-3">
                      Workspace Name
                    </label>
                    <Input
                      placeholder="e.g., Production Team, Development Workspace"
                      value={workspaceName}
                      onChange={(e) => setWorkspaceName(e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 text-lg h-12"
                      autoFocus
                    />
                    <p className="text-white/60 text-sm mt-2">
                      Choose a descriptive name that helps you identify this workspace
                    </p>
                  </div>

                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6">
                    <div className="flex items-start space-x-3">
                      <Github className="w-8 h-8 text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-white mb-2">
                          Next: GitHub Authorization
                        </h4>
                        <p className="text-white/70 text-sm mb-3">
                          After clicking "Continue to GitHub", you'll be redirected to GitHub
                          to authorize SecureThread and select which repositories to include
                          in this workspace.
                        </p>
                        <ul className="text-white/60 text-sm space-y-1 list-disc list-inside">
                          <li>Select specific repositories or all repositories</li>
                          <li>Grant read access for security scanning</li>
                          <li>You can modify repository access anytime</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
                    <h4 className="font-semibold text-white mb-2">
                      What is a workspace?
                    </h4>
                    <p className="text-white/70 text-sm">
                      Workspaces help you organize your security scanning across different
                      projects, teams, or environments. Each workspace has its own
                      repositories, members, and settings.
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-8 border-t border-white/10 flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateWorkspace}
                  className="bg-accent hover:bg-accent/90"
                  disabled={!workspaceName.trim()}
                >
                  <Github className="w-4 h-4 mr-2" />
                  Continue to GitHub
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateWorkspace;