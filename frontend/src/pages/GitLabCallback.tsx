import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { EtherealBackground } from "../components/ui/ethereal-background";
import { IconShield, IconCheck, IconX } from "@tabler/icons-react";

const GitLabCallback = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const state = searchParams.get("state"); // It's good practice to verify the state

      if (!code) {
        setStatus("error");
        setError("No authorization code received from GitLab.");
        return;
      }
      
      // Optional: Verify the state parameter for CSRF protection
      if (state !== 'securethread_gitlab_auth') {
          setStatus("error");
          setError("Invalid state parameter. Authentication aborted for security reasons.");
          return;
      }

      try {
        // Send the code to your backend in a POST request body
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/v1/auth/gitlab/callback`,
          {
            method: "POST", // Correct method is POST
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ code }), // Send code in the body
          }
        );

        const data = await response.json();

        if (response.ok) {
          login(data.access_token, data.user);
          setStatus("success");

          // Redirect to the dashboard after a short delay
          setTimeout(() => {
            navigate("/", { replace: true });
          }, 2000);
        } else {
          setStatus("error");
          setError(data.detail || "Authentication failed on the server.");
        }
      } catch (err) {
        console.error("GitLab callback error:", err);
        setStatus("error");
        setError("A network error occurred during authentication.");
      }
    };

    handleCallback();
  }, [searchParams, login, navigate]);

  // UI for loading, success, and error states
  return (
    <div className="min-h-screen w-full relative flex items-center justify-center p-4">
      <EtherealBackground
        color="rgba(255, 255, 255, 0.6)"
        animation={{ scale: 100, speed: 90 }}
        noise={{ opacity: 0.8, scale: 1.2 }}
        sizing="fill"
      />
      <div className="relative z-10 w-full max-w-md bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20 text-center">
        {status === "loading" && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-accent mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-brand-black">Authenticating with GitLab...</h2>
            <p className="text-brand-gray">Please wait, we're securely logging you in.</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <IconCheck className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-brand-black">Success!</h2>
            <p className="text-brand-gray">Redirecting to your dashboard...</p>
          </>
        )}
        {status === "error" && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <IconX className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-brand-black">Authentication Failed</h2>
            <p className="text-brand-gray mb-4">{error}</p>
            <button
              onClick={() => navigate("/signin", { replace: true })}
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold py-2 px-4 rounded-lg"
            >
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default GitLabCallback;