// frontend/src/pages/RepositoryDetails.tsx

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import RepositoryDetailsComponent from "../components/RepositoryDetails";

interface Project {
  id: number;
  github_id: number;
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  clone_url: string;
  default_branch: string;
  language: string;
  is_private: boolean;
  is_fork: boolean;
  owner: string;
  repository: string;
  source: "github" | "gitlab" | "docker";
  status: "active" | "scanning" | "failed" | "completed" | "pending";
  lastScan: string | null;
  vulnerabilities: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  } | null;
  coverage: number | null;
  isStarred: boolean;
  branch: string;
  scanDuration: string | null;
  created_at: string;
  updated_at: string;
  latest_scan?: {
    id: number;
    status: string;
    started_at: string;
    completed_at?: string;
    scan_duration?: string;
  } | null;
  security_score?: number | null;
  code_coverage?: number | null;
}

const RepositoryDetailsPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (projectId) {
      fetchProject(parseInt(projectId));
    }
  }, [projectId]);

  const fetchProject = async (id: number) => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("access_token");

      // Fetch repository details from the repositories endpoint that includes latest scan
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:8000"
        }/api/v1/repositories/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const repository = data.repositories?.find(
          (repo: any) => repo.id === id
        );

        if (!repository) {
          setError("Project not found");
          return;
        }

        const transformedProject: Project = {
          id: repository.id,
          github_id: repository.github_id,
          name: repository.name,
          full_name: repository.full_name,
          description: repository.description || "No description available",
          html_url: repository.html_url,
          clone_url: repository.clone_url,
          default_branch: repository.default_branch || "main",
          language: repository.language,
          is_private: repository.is_private,
          is_fork: repository.is_fork,
          owner: repository.full_name.split("/")[0],
          repository: repository.name,
          source: "github" as const,
          status:
            repository.latest_scan?.status === "running"
              ? ("scanning" as const)
              : repository.latest_scan?.status === "completed"
              ? ("completed" as const)
              : repository.latest_scan?.status === "failed"
              ? ("failed" as const)
              : ("pending" as const),
          lastScan: repository.latest_scan?.completed_at
            ? new Date(repository.latest_scan.completed_at).toLocaleDateString()
            : null,
          vulnerabilities: repository.vulnerabilities
            ? {
                total: repository.vulnerabilities.total,
                critical: repository.vulnerabilities.critical,
                high: repository.vulnerabilities.high,
                medium: repository.vulnerabilities.medium,
                low: repository.vulnerabilities.low,
              }
            : null,
          coverage: repository.code_coverage,
          isStarred: false,
          branch: repository.default_branch || "main",
          scanDuration: repository.latest_scan?.scan_duration,
          created_at: repository.created_at,
          updated_at: repository.updated_at,
          latest_scan: repository.latest_scan,
          security_score: repository.security_score,
          code_coverage: repository.code_coverage,
        };

        setProject(transformedProject);
      } else {
        setError("Failed to fetch project details");
      }
    } catch (error) {
      console.error("Error fetching project:", error);
      setError("Network error occurred while fetching project");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/projects");
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project details...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-red-600 mb-2">
            Error Loading Project
          </h3>
          <p className="text-red-500 mb-6">{error || "Project not found"}</p>
          <button
            onClick={handleBack}
            className="bg-accent hover:bg-accent/90 theme-text px-6 py-2 rounded-lg"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  return <RepositoryDetailsComponent project={project} onBack={handleBack} />;
};

export default RepositoryDetailsPage;
