import React, { useState, useEffect } from "react";
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
  IconCheck,
} from "@tabler/icons-react";

const SignInPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || "/";
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleGitHubLogin = async () => {
    try {
      setIsLoading(true);
      setError("");

      // Get GitHub authorization URL from backend
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/auth/github/authorize`
      );
      const data = await response.json();

      if (data.authorization_url) {
        // Redirect to GitHub OAuth
        window.location.href = data.authorization_url;
      } else {
        setError("Failed to get GitHub authorization URL");
      }
    } catch (error) {
      console.error("GitHub login error:", error);
      setError("Failed to initiate GitHub login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleComingSoonProvider = (provider: string) => {
    setError(`${provider} integration coming soon!`);
    setTimeout(() => setError(""), 3000);
  };

  return (
    <div className="min-h-screen w-full flex relative overflow-hidden">
      {/* Ethereal Background */}
      <EtherealBackground
        color="rgba(255, 255, 255, 0.6)"
        animation={{ scale: 100, speed: 90 }}
        noise={{ opacity: 0.8, scale: 1.2 }}
        sizing="fill"
      />

      {/* Left Side - Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 relative z-10 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-transparent"></div>
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: '50px 50px'
            }}
          ></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 text-white">
          {/* Logo */}
          <div className="flex items-center space-x-3 mb-12">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
              <IconShield className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold">SECURE THREAD</span>
          </div>

          {/* Main Tagline */}
          <div className="mb-12">
            <h1 className="text-4xl xl:text-5xl font-bold leading-tight mb-6">
            One dashboard for risk, threat, and project security.
            </h1>
          </div>

          {/* Feature List */}
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <IconLink className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Link your projects effortlessly</h3>
                <p className="text-gray-300 leading-relaxed">
                  Connect GitHub, GitLab, and other repositories with one-click integration
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <IconBolt className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Detect vulnerabilities in real time</h3>
                <p className="text-gray-300 leading-relaxed">
                  Advanced AI-powered scanning identifies security threats as they emerge
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <IconTool className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Apply rapid, step-by-step fixes</h3>
                <p className="text-gray-300 leading-relaxed">
                  Get actionable remediation guidance with automated fix suggestions
                </p>
              </div>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 pt-8 border-t border-gray-700">
            <p className="text-sm text-gray-400 mb-4">Trusted by leading software companies</p>
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

      {/* Right Side - Authentication */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-10">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center space-x-2 mb-8">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <IconShield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">SECURE THREAD</span>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">
              Get started for free
            </h2>
            <p className="text-white/80 text-lg">
              Secure in seconds – Start free, no card required
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 backdrop-blur-sm border border-red-500/30 text-red-100 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Authentication Options */}
          <div className="space-y-4 mb-6">
            {/* GitHub Login */}
            <button
              onClick={handleGitHubLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-3 py-4 px-6 bg-[#24292e]/90 hover:bg-[#1a1e22]/90 backdrop-blur-sm text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md border border-white/10"
            >
              <IconBrandGithub className="w-5 h-5" />
              <span>{isLoading ? "Connecting..." : "Continue with GitHub"}</span>
            </button>

            {/* Google Login */}
            <button
              onClick={() => handleComingSoonProvider("Google")}
              className="w-full flex items-center justify-center space-x-3 py-4 px-6 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold rounded-lg border border-white/20 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <IconBrandGoogle className="w-5 h-5 text-[#4285f4]" />
              <span>Continue with Google</span>
            </button>

            {/* GitLab Login */}
            <button
              onClick={() => handleComingSoonProvider("GitLab")}
              className="w-full flex items-center justify-center space-x-3 py-4 px-6 bg-[#fc6d26]/90 hover:bg-[#e85d1f]/90 backdrop-blur-sm text-white font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow-md border border-white/10"
            >
              <IconBrandGitlab className="w-5 h-5" />
              <span>Continue with GitLab</span>
            </button>

            {/* Bitbucket Login */}
            <button
              onClick={() => handleComingSoonProvider("Bitbucket")}
              className="w-full flex items-center justify-center space-x-3 py-4 px-6 bg-[#0052cc]/90 hover:bg-[#003d99]/90 backdrop-blur-sm text-white font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow-md border border-white/10"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M.778 1.213a.768.768 0 00-.768.892l3.263 19.81c.084.5.515.868 1.022.873H19.95a.772.772 0 00.77-.646l3.27-20.03a.768.768 0 00-.768-.891zM14.52 15.53H9.522L8.17 8.466h7.561z"/>
              </svg>
              <span>Continue with Bitbucket</span>
            </button>
          </div>

          {/* Additional Options */}
          <div className="text-center mb-6">
            <p className="text-sm text-white/80">
              Or sign up with{" "}
              <button 
                onClick={() => handleComingSoonProvider("Enterprise SSO")}
                className="text-accent hover:text-accent/80 font-medium transition-colors"
              >
                Enterprise SSO
              </button>{" "}
              |{" "}
              <button 
                onClick={() => handleComingSoonProvider("Docker ID")}
                className="text-accent hover:text-accent/80 font-medium transition-colors"
              >
                Docker ID
              </button>
            </p>
          </div>

          {/* Security Notice */}
          <div className="bg-blue-500/20 backdrop-blur-sm border border-blue-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <IconShield className="w-5 h-5 text-blue-300 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-blue-100 text-sm">Secure read-only access</h4>
                <p className="text-xs text-blue-200 mt-1">
                  Our analysis does not require any agents, just read-only API access. 
                  We never store your code.
                </p>
              </div>
            </div>
          </div>

          {/* Remember Login */}
          <div className="flex items-center justify-center mb-6">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 text-accent bg-white/10 border-white/30 rounded focus:ring-accent focus:ring-2"
              />
              <span className="text-sm text-white/80">Remember my login details</span>
            </label>
          </div>

          {/* Footer */}
          <div className="text-center">
            <p className="text-xs text-white/70 leading-relaxed">
              We will not make any use of the auth provider without your permission.
              <br />
              By logging in or signing up, you agree to abide by our{" "}
              <a href="#" className="text-accent hover:text-accent/80 transition-colors">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-accent hover:text-accent/80 transition-colors">
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