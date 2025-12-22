import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { EtherealBackground } from "../components/ui/ethereal-background";
import { IconShield, IconCheck, IconX } from "@tabler/icons-react";

const GitHubCallback = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  
  // Add ref to prevent multiple requests
  const isProcessing = useRef(false);

  useEffect(() => {
    const handleCallback = async () => {
      // Prevent multiple calls
      if (isProcessing.current) {
        console.log("Already processing callback, skipping...");
        return;
      }
      
      const code = searchParams.get("code");
      const error = searchParams.get("error");

      if (error) {
        setStatus("error");
        setError(`GitHub OAuth error: ${error}`);
        return;
      }

      if (!code) {
        setStatus("error");
        setError("No authorization code received from GitHub");
        return;
      }

      // Mark as processing
      isProcessing.current = true;

      try {
        console.log("Sending OAuth code to backend:", code.substring(0, 10) + "...");
        
        // Send code to backend for token exchange
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/v1/auth/github/callback`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ code }),
          }
        );

        const data = await response.json();
        console.log("Backend response:", response.status, data);

        if (response.ok) {
          // Login successful
          login(data.access_token, data.user);
          setStatus("success");

          // Redirect to dashboard after a short delay
          setTimeout(() => {
            navigate("/", { replace: true });
          }, 2000);
        } else if (response.status === 409) {
          // Conflict - already processing
          setStatus("error");
          setError("Authentication is being processed. Please wait a moment and refresh the page.");
        } else if (response.status === 400 && data.detail?.includes("already been used")) {
          // Code already used - this might be a duplicate request
          setStatus("error");
          setError("This authentication session has expired. Please try signing in again.");
        } else {
          setStatus("error");
          setError(data.detail || "Authentication failed");
        }
      } catch (error) {
        console.error("Callback error:", error);
        setStatus("error");
        setError("Network error occurred during authentication");
      } finally {
        // Reset processing flag after a delay
        setTimeout(() => {
          isProcessing.current = false;
        }, 2000);
      }
    };

    handleCallback();
  }, [searchParams, login, navigate]);

  const handleRetry = () => {
    // Reset processing flag
    isProcessing.current = false;
    navigate("/signin", { replace: true });
  };

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
            <IconShield className="h-8 w-8 theme-text" />
            <span className="text-2xl font-bold theme-text">SECURE THREAD</span>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
          <div className="text-center">
            {status === "loading" && (
              <>
                <div className="w-16 h-16 mx-auto mb-4">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-accent"></div>
                </div>
                <h2 className="text-xl font-semibold text-brand-black mb-2">
                  Authenticating with GitHub...
                </h2>
                <p className="text-brand-gray text-sm">
                  Please wait while we process your authentication.
                </p>
              </>
            )}

            {status === "success" && (
              <>
                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                  <IconCheck className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-brand-black mb-2">
                  Authentication Successful!
                </h2>
                <p className="text-brand-gray text-sm">
                  Redirecting you to the dashboard...
                </p>
              </>
            )}

            {status === "error" && (
              <>
                <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                  <IconX className="h-8 w-8 text-red-600" />
                </div>
                <h2 className="text-xl font-semibold text-brand-black mb-2">
                  Authentication Failed
                </h2>
                <p className="text-brand-gray text-sm mb-4">{error}</p>
                <button
                  onClick={handleRetry}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold py-2 px-4 rounded-lg transition-colors"
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

export default GitHubCallback;
