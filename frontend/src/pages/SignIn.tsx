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

const SignInPage = () => {
  // Use a string to track which provider is loading
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [error, setError] = useState("");

  const popup = useRef<Window | null>(null);
  // Ref to hold the interval ID for the popup checker
  const popupInterval = useRef<number | null>(null);

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
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const state = urlParams.get("state");
    const errorParam = urlParams.get("error");

    // If this page is running inside a popup...
    if (window.opener) {
      if (code && state) {
        // Send a success message to the parent window
        window.opener.postMessage(
          { type: "oauth-success", code, state },
          window.location.origin
        );
      } else if (errorParam) {
        // Send an error message to the parent window
        window.opener.postMessage(
          { type: "oauth-error", error: errorParam },
          window.location.origin
        );
      }
      // Close the popup
      window.close();
      return;
    }

    // Handle callbacks in main window
    if (code && state) {
      if (state === "securethread_github_auth") {
        handleGitHubCallback(code);
      } else if (state === "securethread_google_auth") {
        handleGoogleCallbackInMainWindow(code);
      }
    }
  }, []);

  // Listens for messages from the popup window
  useEffect(() => {
    const handlePopupMessage = (event: MessageEvent) => {
  console.log("SignIn: Received message from popup:", event.data);
  console.log("SignIn: Event origin:", event.origin);
  console.log("SignIn: Window origin:", window.location.origin);
      if (event.origin !== window.location.origin) return;

      const { type, code, state, error } = event.data;

      // When a message is received, stop checking if the popup is closed
      if (popupInterval.current) {
        window.clearInterval(popupInterval.current);
        popupInterval.current = null;
      }

      if (type === "oauth-success") {
        if (state === "securethread_gitlab_auth") {
          handleGitLabCallback(code);
        } else if (state === "securethread_bitbucket_auth") {
          handleBitbucketCallback(code);
        }
        // Google is handled via direct redirect, not popup
        if (popup.current) {
          try {
            popup.current.close();
          } catch (e) {
            // Ignore errors when closing popup
            console.log("Could not close popup window");
          }
          popup.current = null;
        }
      } else if (type === "oauth-error") {
        setError("Authentication was cancelled or failed.");
        setLoadingProvider(null);
        if (popup.current) {
          try {
            popup.current.close();
          } catch (e) {
            // Ignore errors when closing popup
            console.log("Could not close popup window");
          }
          popup.current = null;
        }
      }
    };

    window.addEventListener("message", handlePopupMessage);

    return () => {
      window.removeEventListener("message", handlePopupMessage);
      if (popupInterval.current) {
        window.clearInterval(popupInterval.current);
        popupInterval.current = null;
      }
    };
  }, []);

  // Safe popup checking function
  const checkPopupClosed = () => {
    if (popup.current) {
      try {
        if (popup.current.closed) {
          if (popupInterval.current) {
            window.clearInterval(popupInterval.current);
            popupInterval.current = null;
          }
          setLoadingProvider(null);
          popup.current = null;
        }
      } catch (e) {
        // If we can't access popup.closed due to CORS, clear the interval
        if (popupInterval.current) {
          window.clearInterval(popupInterval.current);
          popupInterval.current = null;
        }
        setLoadingProvider(null);
        popup.current = null;
      }
    }
  };

  const handleGitHubLogin = async () => {
    try {
      setLoadingProvider("github");
      setError("");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/auth/github/authorize`
      );
      const data = await response.json();
      if (data.authorization_url) {
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
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/auth/github/callback`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        }
      );
      if (!response.ok) throw new Error("Failed to authenticate with GitHub");
      const data = await response.json();
      if (data.access_token) {
        login(data.access_token, data.user || {});
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
        const from = location.state?.from?.pathname || "/";
        navigate(from, { replace: true });
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      console.error("GitHub callback error:", err);
      setError("Failed to sign in with GitHub. Please try again.");
      window.history.replaceState({}, document.title, window.location.pathname);
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoadingProvider("google");
      setError("");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/auth/google/authorize`
      );
      const data = await response.json();
      if (data.authorization_url) {
        // Use direct redirect instead of popup for Google OAuth
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
    try {
      setLoadingProvider("google");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/auth/google/callback`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        }
      );
      if (!response.ok)
        throw new Error(
          `Failed to authenticate with Google: ${response.status}`
        );
      const data = await response.json();
      if (data.access_token) {
        login(data.access_token, data.user || {});
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
        const from = location.state?.from?.pathname || "/";
        navigate(from, { replace: true });
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      console.error("Google callback error:", err);
      setError("Failed to sign in with Google. Please try again.");
      window.history.replaceState({}, document.title, window.location.pathname);
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleGitLabLogin = async () => {
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
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/auth/gitlab/callback`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        }
      );
      if (!response.ok)
        throw new Error(
          `Failed to authenticate with GitLab: ${response.status}`
        );
      const data = await response.json();
      if (data.access_token) {
        login(data.access_token, data.user || {});
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
        const from = location.state?.from?.pathname || "/";
        navigate(from, { replace: true });
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      console.error("GitLab callback error:", err);
      setError("Failed to sign in with GitLab. Please try again.");
      window.history.replaceState({}, document.title, window.location.pathname);
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleBitbucketLogin = async () => {
    try {
      setLoadingProvider("bitbucket");
      setError("");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/auth/bitbucket/auth-url`
      );
      const data = await response.json();
      if (data.authorization_url) {
        const width = 600,
          height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;
        popup.current = window.open(
          data.authorization_url,
          "bitbucket-auth-popup",
          `width=${width},height=${height},top=${top},left=${left}`
        );

        popupInterval.current = window.setInterval(checkPopupClosed, 1000);
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
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/auth/bitbucket/callback`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        }
      );
      if (!response.ok)
        throw new Error(
          `Failed to authenticate with Bitbucket: ${response.status}`
        );
      const data = await response.json();
      if (data.access_token) {
        login(data.access_token, data.user || {});
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
        const from = location.state?.from?.pathname || "/";
        navigate(from, { replace: true });
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      console.error("Bitbucket callback error:", err);
      setError("Failed to sign in with Bitbucket. Please try again.");
      window.history.replaceState({}, document.title, window.location.pathname);
    } finally {
      setLoadingProvider(null);
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
            <div className="w-10 h-10 bg-[#FF6B00] rounded-lg flex items-center justify-center">
              <IconShield className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold">SECURE THREAD</span>
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