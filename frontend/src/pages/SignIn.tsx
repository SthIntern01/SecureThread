import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { EtherealBackground } from "../components/ui/ethereal-background";
import {
  IconBrandGithub,
  IconBrandGitlab,
  IconBrandGoogle,
  IconShield,
  IconLink,
  IconBolt,
  IconTool,
} from "@tabler/icons-react";
import sandboxLogo from "../images/sandboxlogo.png";

const SignInPage = () => {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [error, setError] = useState("");
  const popup = useRef<Window | null>(null);
  const popupInterval = useRef<number | null>(null);

  // Session-based tracking to prevent all duplicate requests
  const sessionKey = `oauth_session_${Date.now()}_${Math.random()}`;
  const isProcessingRef = useRef(false);

  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || "/";
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  useEffect(() => {
    // Create a unique session identifier for this page load
    const currentSession = sessionStorage.getItem("oauth_session");
    if (!currentSession) {
      sessionStorage.setItem("oauth_session", sessionKey);
    }

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const state = urlParams.get("state");
    const errorParam = urlParams.get("error");

    // If this page is running inside a popup...
    if (window.opener) {
      if (code && state) {
        window.opener.postMessage(
          { type: "oauth-success", code, state },
          window.location.origin
        );
      } else if (errorParam) {
        window.opener.postMessage(
          { type: "oauth-error", error: errorParam },
          window.location.origin
        );
      }
      window.close();
      return;
    }

    // Handle callbacks in main window with session-based deduplication
   if (code && state) {
  const storedSession = sessionStorage.getItem("oauth_session");
  const processingKey = `processing_${code}`;
  const processedKey = `processed_${code}`;

  if (
    localStorage.getItem(processingKey) ||
    localStorage.getItem(processedKey)
  ) {
    console.log("OAuth code already being processed or completed");
    return;
  }

  if (isProcessingRef.current) {
    console.log("OAuth already processing in this session");
    return;
  }

  isProcessingRef.current = true;
  localStorage.setItem(processingKey, storedSession || sessionKey);

  if (state === "securethread_github_auth") {
    handleGitHubCallback(code);
  } else if (state === "securethread_google_auth") {
    handleGoogleCallbackInMainWindow(code);
  } else if (state === "securethread_bitbucket_auth") {  // ADD THIS
    handleBitbucketCallback(code);
  }
}

    // Cleanup old processing flags on page load
    const cleanupOldFlags = () => {
      const now = Date.now();
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key?.startsWith("processing_") || key?.startsWith("processed_")) {
          const timestamp = localStorage.getItem(key + "_timestamp");
          if (timestamp && now - parseInt(timestamp) > 300000) {
            // 5 minutes
            localStorage.removeItem(key);
            localStorage.removeItem(key + "_timestamp");
          }
        }
      }
    };
    cleanupOldFlags();
  }, []); // Empty dependency array

  // Session cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear processing flag when component unmounts
      const currentSession = sessionStorage.getItem("oauth_session");
      if (currentSession) {
        Object.keys(localStorage).forEach((key) => {
          if (
            key.startsWith("processing_") &&
            localStorage.getItem(key) === currentSession
          ) {
            localStorage.removeItem(key);
          }
        });
      }
    };
  }, []);

  // Popup message handler
  useEffect(() => {
    const handlePopupMessage = (event: MessageEvent) => {
      console.log("SignIn: Received message from popup:", event.data);
      console.log("SignIn: Event origin:", event.origin);
      console.log("SignIn: Window origin:", window.location.origin);

      if (event.origin !== window.location.origin) return;

      const { type, code, state, error } = event.data;

      if (popupInterval.current) {
        window.clearInterval(popupInterval.current);
        popupInterval.current = null;
      }

      if (type === "oauth-success") {
        const processingKey = `processing_${code}`;
        if (localStorage.getItem(processingKey)) {
          console.log("Popup OAuth code already being processed");
          return;
        }

        const currentSession = sessionStorage.getItem("oauth_session");
        localStorage.setItem(processingKey, currentSession || sessionKey);
        isProcessingRef.current = true;

        if (state === "securethread_gitlab_auth") {
          handleGitLabCallback(code);
        } else if (state === "securethread_bitbucket_auth") {
          handleBitbucketCallback(code);
        }

        if (popup.current) {
          try {
            popup.current.close();
          } catch (e) {
            console.log("Could not close popup window");
          }
          popup.current = null;
        }
      } else if (type === "oauth-error") {
        setError("Authentication was cancelled or failed.");
        setLoadingProvider(null);
        isProcessingRef.current = false;

        if (popup.current) {
          try {
            popup.current.close();
          } catch (e) {
            console.log("Could not close popup window");
          }
          popup.current = null;
        }
      }
    };

    window.addEventListener("message", handlePopupMessage);
    return () => window.removeEventListener("message", handlePopupMessage);
  }, []);

  const checkPopupClosed = () => {
    if (popup.current) {
      try {
        if (popup.current.closed) {
          if (popupInterval.current) {
            window.clearInterval(popupInterval.current);
            popupInterval.current = null;
          }
          setLoadingProvider(null);
          isProcessingRef.current = false;
          popup.current = null;
        }
      } catch (e) {
        if (popupInterval.current) {
          window.clearInterval(popupInterval.current);
          popupInterval.current = null;
        }
        setLoadingProvider(null);
        isProcessingRef.current = false;
        popup.current = null;
      }
    }
  };

  const handleGitHubLogin = async () => {
    if (loadingProvider !== null) {
      console.log("Login already in progress, ignoring click");
      return;
    }

    try {
      setLoadingProvider("github");
      setError("");

      console.log("Initiating GitHub login...");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/auth/github/authorize`
      );
      const data = await response.json();

      if (data.authorization_url) {
        console.log("Redirecting to GitHub OAuth...");
        window.location.href = data.authorization_url;
      } else {
        setError("Failed to get GitHub authorization URL");
        setLoadingProvider(null);
      }
    } catch (error) {
      console.error("GitHub login error:", error);
      setError("Failed to initiate GitHub login");
      setLoadingProvider(null);
    }
  };

  const handleGitHubCallback = async (code: string) => {
    const processingKey = `processing_${code}`;
    const processedKey = `processed_${code}`;

    try {
      console.log(
        "Processing GitHub callback with code:",
        code.substring(0, 10) + "..."
      );

      setLoadingProvider("github");

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/auth/github/callback`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        }
      );

      console.log("GitHub callback response status:", response.status);

      // Handle expected duplicate request responses silently
      if (response.status === 409) {
        console.log(
          "OAuth code currently being processed in another request, waiting..."
        );
        // Wait for the other request to complete
        setTimeout(() => {
          if (localStorage.getItem(processedKey)) {
            console.log("OAuth completed by another request, refreshing page");
            window.location.reload();
          }
        }, 2000);
        return;
      }

      if (response.status === 400) {
        console.log("OAuth code already processed, checking if we should redirect");
        // Check if we're authenticated and should redirect
        setTimeout(() => {
          window.location.reload();
        }, 1000);
        return;
      }

      if (!response.ok) {
        const errorData = await response.text();
        console.error("GitHub callback failed:", response.status, errorData);
        throw new Error(`Authentication failed: ${response.status}`);
      }

      const data = await response.json();
      console.log("GitHub callback successful, got token");

      if (data.access_token) {
        // Mark as successfully processed
        localStorage.setItem(processedKey, "true");
        localStorage.setItem(
          processedKey + "_timestamp",
          Date.now().toString()
        );

        login(data.access_token, data.user || {});

        // Clean up URL
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );

        const from = location.state?.from?.pathname || "/";
        navigate(from, { replace: true });
      } else {
        throw new Error("Invalid response from server - no access token");
      }
    } catch (err) {
      console.error("GitHub callback error:", err);

      // Only show error if this is the main processing session
      const currentSession = sessionStorage.getItem("oauth_session");
      if (localStorage.getItem(processingKey) === currentSession) {
        setError("Failed to sign in with GitHub. Please try again.");
      }

      window.history.replaceState({}, document.title, window.location.pathname);
    } finally {
      // Clean up processing flag
      localStorage.removeItem(processingKey);
      setLoadingProvider(null);
      isProcessingRef.current = false;
    }
  };

  const handleGoogleLogin = async () => {
    if (loadingProvider !== null) {
      console.log("Login already in progress, ignoring click");
      return;
    }

    try {
      setLoadingProvider("google");
      setError("");

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/auth/google/authorize`
      );
      const data = await response.json();

      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        setError("Failed to get Google authorization URL");
        setLoadingProvider(null);
      }
    } catch (error) {
      console.error("Google login error:", error);
      setError("Failed to initiate Google login");
      setLoadingProvider(null);
    }
  };

  const handleGoogleCallbackInMainWindow = async (code: string) => {
    const processingKey = `processing_${code}`;
    const processedKey = `processed_${code}`;

    try {
      console.log("Processing Google callback...");
      setLoadingProvider("google");

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/auth/google/callback`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        }
      );

      if (response.status === 409) {
        console.log("Google OAuth code currently being processed, waiting...");
        setTimeout(() => {
          if (localStorage.getItem(processedKey)) {
            window.location.reload();
          }
        }, 2000);
        return;
      }

      if (response.status === 400) {
        console.log("Google OAuth code already processed");
        setTimeout(() => window.location.reload(), 1000);
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to authenticate with Google: ${response.status}`);
      }

      const data = await response.json();

      if (data.access_token) {
        localStorage.setItem(processedKey, "true");
        localStorage.setItem(
          processedKey + "_timestamp",
          Date.now().toString()
        );

        login(data.access_token, data.user || {});
        window.history.replaceState({}, document.title, window.location.pathname);
        const from = location.state?.from?.pathname || "/";
        navigate(from, { replace: true });
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      console.error("Google callback error:", err);
      const currentSession = sessionStorage.getItem("oauth_session");
      if (localStorage.getItem(processingKey) === currentSession) {
        setError("Failed to sign in with Google. Please try again.");
      }
      window.history.replaceState({}, document.title, window.location.pathname);
    } finally {
      localStorage.removeItem(processingKey);
      setLoadingProvider(null);
      isProcessingRef.current = false;
    }
  };

  const handleGitLabLogin = async () => {
    if (loadingProvider !== null) {
      console.log("Login already in progress, ignoring click");
      return;
    }

    try {
      setLoadingProvider("gitlab");
      setError("");

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/auth/gitlab/authorize`
      );
      const data = await response.json();

      if (data.authorization_url) {
        const width = 600,
          height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;
        popup.current = window.open(
          data.authorization_url,
          "gitlab-auth-popup",
          `width=${width},height=${height},top=${top},left=${left}`
        );

        popupInterval.current = window.setInterval(checkPopupClosed, 1000);
      } else {
        setError("Failed to get GitLab authorization URL");
        setLoadingProvider(null);
      }
    } catch (error) {
      console.error("GitLab login error:", error);
      setError("Failed to initiate GitLab login");
      setLoadingProvider(null);
    }
  };

  const handleGitLabCallback = async (code: string) => {
    const processingKey = `processing_${code}`;
    const processedKey = `processed_${code}`;

    try {
      console.log("Processing GitLab callback...");

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/auth/gitlab/callback`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        }
      );

      if (response.status === 409) {
        console.log("GitLab OAuth code currently being processed, waiting...");
        setTimeout(() => {
          if (localStorage.getItem(processedKey)) {
            window.location.reload();
          }
        }, 2000);
        return;
      }

      if (response.status === 400) {
        console.log("GitLab OAuth code already processed");
        setTimeout(() => window.location.reload(), 1000);
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to authenticate with GitLab: ${response.status}`);
      }

      const data = await response.json();

      if (data.access_token) {
        localStorage.setItem(processedKey, "true");
        localStorage.setItem(
          processedKey + "_timestamp",
          Date.now().toString()
        );

        login(data.access_token, data.user || {});
        window.history.replaceState({}, document.title, window.location.pathname);
        const from = location.state?.from?.pathname || "/";
        navigate(from, { replace: true });
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      console.error("GitLab callback error:", err);
      const currentSession = sessionStorage.getItem("oauth_session");
      if (localStorage.getItem(processingKey) === currentSession) {
        setError("Failed to sign in with GitLab. Please try again.");
      }
      window.history.replaceState({}, document.title, window.location.pathname);
    } finally {
      localStorage.removeItem(processingKey);
      setLoadingProvider(null);
      isProcessingRef.current = false;
    }
  };

  const handleBitbucketLogin = async () => {
  if (loadingProvider !== null) {
    console.log("Login already in progress, ignoring click");
    return;
  }

  try {
    setLoadingProvider("bitbucket");
    setError("");

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/v1/auth/bitbucket/auth-url`
    );
    const data = await response.json();

    if (data.authorization_url) {
      // Use full redirect flow like GitHub
      window.location.href = data.authorization_url;
    } else {
      setError("Failed to get Bitbucket authorization URL");
      setLoadingProvider(null);
    }
  } catch (error) {
    console.error("Bitbucket login error:", error);
    setError("Failed to initiate Bitbucket login");
    setLoadingProvider(null);
  }
};

  const handleBitbucketCallback = async (code: string) => {
    const processingKey = `processing_${code}`;
    const processedKey = `processed_${code}`;

    try {
      console.log("Processing Bitbucket callback...");

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/auth/bitbucket/callback`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        }
      );

      if (response.status === 409) {
        console.log("Bitbucket OAuth code currently being processed, waiting...");
        setTimeout(() => {
          if (localStorage.getItem(processedKey)) {
            window.location.reload();
          }
        }, 2000);
        return;
      }

      if (response.status === 400) {
        console.log("Bitbucket OAuth code already processed");
        setTimeout(() => window.location.reload(), 1000);
        return;
      }

      if (!response.ok) {
        throw new Error(
          `Failed to authenticate with Bitbucket: ${response.status}`
        );
      }

      const data = await response.json();

      if (data.access_token) {
        localStorage.setItem(processedKey, "true");
        localStorage.setItem(
          processedKey + "_timestamp",
          Date.now().toString()
        );

        login(data.access_token, data.user || {});
        window.history.replaceState({}, document.title, window.location.pathname);
        const from = location.state?.from?.pathname || "/";
        navigate(from, { replace: true });
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      console.error("Bitbucket callback error:", err);
      const currentSession = sessionStorage.getItem("oauth_session");
      if (localStorage.getItem(processingKey) === currentSession) {
        setError("Failed to sign in with Bitbucket. Please try again.");
      }
      window.history.replaceState({}, document.title, window.location.pathname);
    } finally {
      localStorage.removeItem(processingKey);
      setLoadingProvider(null);
      isProcessingRef.current = false;
    }
  };

  const handleComingSoonProvider = (provider: string) => {
    setError(`${provider} integration coming soon!`);
    setTimeout(() => setError(""), 3000);
  };

  return (
    <div className="min-h-screen w-full flex relative overflow-hidden bg-[#111111]">
      <EtherealBackground
        className="absolute inset-0"
        color="rgba(255, 255, 255, 0.6)"
        animation={{ scale: 100, speed: 90 }}
        noise={{ opacity: 0.8, scale: 1.2 }}
        sizing="fill"
      />
      <div className="hidden lg:flex lg:w-1/2 relative z-10 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-transparent"></div>
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: "50px 50px",
            }}
          ></div>
        </div>
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 text-white">
          <div className="flex items-center space-x-3 mb-12">
            <img 
              src={sandboxLogo} 
              alt="Sandbox Logo" 
              className="w-70 h-20"
            />
          </div>
          <div className="mb-12">
            <h1 className="text-4xl xl:text-5xl font-bold leading-tight mb-6">
              One dashboard for risk, threat, and project security.
            </h1>
          </div>
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-[#FF6B00]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <IconLink className="w-6 h-6 text-[#FF6B00]" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  Link your projects effortlessly
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  Connect GitHub, GitLab, Bitbucket, and other repositories with one-click
                  integration
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-[#FF6B00]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <IconBolt className="w-6 h-6 text-[#FF6B00]" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  Detect vulnerabilities in real time
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  Advanced AI-powered scanning identifies security threats as
                  they emerge
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-[#FF6B00]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <IconTool className="w-6 h-6 text-[#FF6B00]" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  Apply rapid, step-by-step fixes
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  Get actionable remediation guidance with automated fix
                  suggestions
                </p>
              </div>
            </div>
          </div>
          <div className="mt-16 pt-8 border-t border-gray-700">
            <p className="text-sm text-gray-400 mb-4">
              Trusted by leading software companies
            </p>
            <div className="flex items-center space-x-6 opacity-60">
              <div className="text-xs font-medium">SOC 2</div>
              <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
              <div className="text-xs font-medium">ISO 27001</div>
              <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
              <div className="text-xs font-medium">GDPR Compliant</div>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center justify-center space-x-2 mb-8">
            <div className="w-8 h-8 bg-[#FF6B00] rounded-lg flex items-center justify-center">
              <IconShield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">SECURE THREAD</span>
          </div>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">
              Get started for free
            </h2>
            <p className="text-white/80 text-lg">
              Secure in seconds – Start free, no card required
            </p>
          </div>
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 backdrop-blur-sm border border-red-500/30 text-red-100 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div className="space-y-4 mb-6">
            <button
              onClick={handleGitHubLogin}
              disabled={loadingProvider !== null}
              className="w-full flex items-center justify-center space-x-3 py-4 px-6 bg-[#24292e]/90 hover:bg-[#1a1e22]/90 backdrop-blur-sm text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md border border-white/10"
            >
              <IconBrandGithub className="w-5 h-5" />
              <span>
                {loadingProvider === "github"
                  ? "Connecting..."
                  : "Continue with GitHub"}
              </span>
            </button>
            <button
              onClick={handleGoogleLogin}
              disabled={loadingProvider !== null}
              className="w-full flex items-center justify-center space-x-3 py-4 px-6 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold rounded-lg border border-white/20 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50"
            >
              <IconBrandGoogle className="w-5 h-5 text-[#4285f4]" />
              <span>
                {loadingProvider === "google"
                  ? "Connecting..."
                  : "Continue with Google"}
              </span>
            </button>
            <button
              onClick={handleGitLabLogin}
              disabled={loadingProvider !== null}
              className="w-full flex items-center justify-center space-x-3 py-4 px-6 bg-[#fc6d26]/90 hover:bg-[#e85d1f]/90 backdrop-blur-sm text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md border border-white/10"
            >
              <IconBrandGitlab className="w-5 h-5" />
              <span>
                {loadingProvider === "gitlab"
                  ? "Connecting..."
                  : "Continue with GitLab"}
              </span>
            </button>
            <button
              onClick={handleBitbucketLogin}
              disabled={loadingProvider !== null}
              className="w-full flex items-center justify-center space-x-3 py-4 px-6 bg-[#0052cc]/90 hover:bg-[#003d99]/90 backdrop-blur-sm text-white font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow-md border border-white/10 disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M.778 1.213a.768.768 0 00-.768.892l3.263 19.81c.084.5.515.868 1.022.873H19.95a.772.772 0 00.77-.646l3.27-20.03a.768.768 0 00-.768-.891zM14.52 15.53H9.522L8.17 8.466h7.561z" />
              </svg>
              <span>
                {loadingProvider === "bitbucket"
                  ? "Connecting..."
                  : "Continue with Bitbucket"}
              </span>
            </button>
          </div>
          <div className="text-center mb-6">
            <p className="text-sm text-white/80">
              Or sign up with{" "}
              <button
                onClick={() => handleComingSoonProvider("Enterprise SSO")}
                className="text-[#FF6B00] hover:text-[#FF6B00]/80 font-medium transition-colors"
              >
                Enterprise SSO
              </button>{" "}
              |{" "}
              <button
                onClick={() => handleComingSoonProvider("Docker ID")}
                className="text-[#FF6B00] hover:text-[#FF6B00]/80 font-medium transition-colors"
              >
                Docker ID
              </button>
            </p>
          </div>
          <div className="bg-blue-500/20 backdrop-blur-sm border border-blue-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <IconShield className="w-5 h-5 text-blue-300 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-blue-100 text-sm">
                  Secure read-only access
                </h4>
                <p className="text-xs text-blue-200 mt-1">
                  Our analysis does not require any agents, just read-only API
                  access. We never store your code.
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center mb-6">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 text-[#FF6B00] bg-white/10 border-white/30 rounded focus:ring-accent focus:ring-2"
              />
              <span className="text-sm text-white/80">
                Remember my login details
              </span>
            </label>
          </div>
          <div className="text-center">
            <p className="text-xs text-white/70 leading-relaxed">
              We will not make any use of the auth provider without your
              permission.
              <br />
              By logging in or signing up, you agree to abide by our{" "}
              <a
                href="#"
                className="text-[#FF6B00] hover:text-[#FF6B00]/80 transition-colors"
              >
                Terms of Service
              </a>{" "}
              and{" "}
              <a
                href="#"
                className="text-[#FF6B00] hover:text-[#FF6B00]/80 transition-colors"
              >
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;