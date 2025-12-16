import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EtherealBackground } from "../components/ui/ethereal-background";
import AppSidebar from "@/components/AppSidebar";
import {
  Search,
  ChevronRight,
  BookOpen,
  Shield,
  Code,
  Zap,
  Eye,
  Users,
  GitBranch,
  CheckCircle,
  Copy,
  Play,
  Terminal,
  Globe,
  Lock,
  TrendingUp,
  FileText,
  Bot,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  Settings,
  Activity,
  Lightbulb,
  AlertTriangle,
} from "lucide-react";



const FeatureCard = ({ icon, title, description, features }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  features: string[];
}) => (
  <div className="theme-bg-subtle backdrop-blur-sm rounded-2xl border theme-border p-6 hover:bg-gray-100/80 dark:hover:bg-white/15 transition-all duration-300">
    <div className="flex items-center space-x-3 mb-4">
      <div className="p-3 bg-accent/20 rounded-xl">
        {icon}
      </div>
      <h3 className="text-xl font-semibold theme-text">{title}</h3>
    </div>
    <p className="theme-text-secondary mb-4">{description}</p>
    <ul className="space-y-2">
      {features.map((feature, idx) => (
        <li key={idx} className="flex items-center space-x-2 text-sm theme-text-secondary">
          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
          <span>{feature}</span>
        </li>
      ))}
    </ul>
  </div>
);

const Docs = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  const toggleAccordion = (id: string) => {
    setOpenAccordion(openAccordion === id ? null : id);
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
          <div className="max-w-6xl mx-auto">
            {/* Header Container */}
            <div className="bg-gray-100/80 dark:bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 shadow-2xl overflow-hidden mb-6">
              {/* Header Section */}
              <div className="p-8 border-b theme-border">
                <div className="flex items-center space-x-2 text-sm mb-4">
                  <span className="font-medium theme-text">SecureThread</span>
                  <ChevronRight size={16} className="theme-text-muted" />
                  <span className="font-medium theme-text">Documentation</span>
                </div>

                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-bold theme-text mb-2">
                      Documentation
                    </h1>
                    <p className="theme-text-secondary">
                      Complete guide to securing your applications with SecureThread
                    </p>
                  </div>
                  <div className="mt-6 lg:mt-0 flex space-x-3">
                    <Button
                      variant="outline"
                      className="border-white/20 theme-text hover:bg-gray-100/80 dark:hover:bg-white/20"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      API Reference
                    </Button>
                    <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                      <Play className="w-4 h-4 mr-2" />
                      Quick Start
                    </Button>
                  </div>
                </div>
              </div>

              
            </div>

            {/* Introduction Section */}
            <div className="bg-gray-100/80 dark:bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 shadow-2xl overflow-hidden mb-6">
              <div className="p-8">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-accent/20 to-accent/40 rounded-full mx-auto mb-6 flex items-center justify-center">
                    <Shield className="w-10 h-10 text-accent" />
                  </div>
                  <h2 className="text-3xl font-bold theme-text mb-4">What is SecureThread?</h2>
                  <p className="text-xl theme-text-secondary max-w-4xl mx-auto leading-relaxed mb-6">
                    SecureThread is an enterprise-grade Vulnerability Management System (VMS) designed to help 
                    development teams identify, track, and remediate security vulnerabilities across their entire 
                    codebase. Similar to industry-leading tools like Snyk and Aikido, SecureThread provides 
                    real-time security insights, automated scanning capabilities, and AI-powered remediation guidance.
                  </p>
                  
                </div>

                <div className="grid md: grid-cols-4 gap-6">
                  <div className="text-center p-6 theme-bg-subtle rounded-2xl border theme-border">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-xl mx-auto mb-4 flex items-center justify-center">
                      <Eye className="w-6 h-6 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold theme-text mb-2">Continuous Monitoring</h3>
                    <p className="theme-text-secondary text-sm">24/7 automated security scanning across your application stack</p>
                  </div>
                  <div className="text-center p-6 theme-bg-subtle rounded-2xl border theme-border">
                    <div className="w-12 h-12 bg-red-500/20 rounded-xl mx-auto mb-4 flex items-center justify-center">
                      <Zap className="w-6 h-6 text-red-400" />
                    </div>
                    <h3 className="text-lg font-semibold theme-text mb-2">Instant Alerts</h3>
                    <p className="theme-text-secondary text-sm">Real-time notifications and automated remediation suggestions</p>
                  </div>
                  <div className="text-center p-6 theme-bg-subtle rounded-2xl border theme-border">
                    <div className="w-12 h-12 bg-green-500/20 rounded-xl mx-auto mb-4 flex items-center justify-center">
                      <Lock className="w-6 h-6 text-green-400" />
                    </div>
                    <h3 className="text-lg font-semibold theme-text mb-2">Multi-Layer Security</h3>
                    <p className="theme-text-secondary text-sm">Comprehensive coverage from source code to deployment</p>
                  </div>
                  <div className="text-center p-6 theme-bg-subtle rounded-2xl border theme-border">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-xl mx-auto mb-4 flex items-center justify-center">
                      <Bot className="w-6 h-6 text-purple-400" />
                    </div>
                    <h3 className="text-lg font-semibold theme-text mb-2">AI-Powered Insights</h3>
                    <p className="theme-text-secondary text-sm">Smart vulnerability analysis and fix recommendations</p>
                  </div>
                </div>
              </div>
            </div>

             {/* Dashboard Showcase Section - NEW */}
            
              <div className="bg-gray-100/80 dark:bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 shadow-2xl overflow-hidden mb-6">
              <div className="p-8 text-center">
                <h2 className="text-3xl font-bold theme-text mb-3">Here's How SecureThread Works</h2>
                <p className="text-lg theme-text-secondary mb-8 max-w-3xl mx-auto">
                  Hint: It's unbelievably easy.  Scan, analyze, and remediate vulnerabilities in minutes.
                </p>
                
                {/* Dashboard Screenshot */}
                <div className="relative mx-auto max-w-5xl">
                  <div className="rounded-2xl overflow-hidden border-4 border-white/50 dark:border-gray-700/50 shadow-2xl">
                    <img 
                      src="/assets/dashboard-ss.png" 
                      alt="SecureThread Dashboard" 
                      className="w-full h-auto"
                    />
                  </div>
                  
                  {/* Optional decorative elements */}
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-orange-500/20 rounded-full blur-3xl"></div>
                  <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-orange-400/20 rounded-full blur-3xl"></div>
                </div>

               
              </div>
            </div>


            {/* Core Features - Bento Grid Layout */}
              <div className="p-8">
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-fr">
    {/* Large Feature - Automated Vulnerability Scanning */}
    <div className="md:col-span-2 md:row-span-2 theme-bg-subtle rounded-2xl border theme-border p-6 hover:border-accent/50 transition-all duration-300 flex flex-col">
      <div className="flex items-start space-x-3 mb-4">
        <div className="p-3 bg-accent/20 rounded-xl">
          <Shield className="w-6 h-6 text-accent" />
        </div>
        <div>
          <h3 className="text-2xl font-semibold theme-text mb-2">Automated Vulnerability Scanning</h3>
          <p className="theme-text-secondary">
            Comprehensive security analysis covering OWASP Top 10, SQL Injection, XSS, CSRF detection, 
            insecure dependencies, and hardcoded secrets detection.
          </p>
        </div>
      </div>
      <div className="flex-1 mt-4 flex items-center justify-center p-4">
        <img 
          src="/assets/vulnerability-scanning-preview.png" 
          alt="Vulnerability Scanning Dashboard" 
          className="max-w-full max-h-full object-contain rounded-lg border border-white/10 shadow-lg"
        />
      </div>
    </div>

    {/* Feature 2 - Static Code Analysis */}
    <div className="theme-bg-subtle rounded-2xl border theme-border p-6 hover:border-accent/50 transition-all duration-300 flex flex-col">
      <div className="flex items-start space-x-3 mb-3">
        <div className="p-2 bg-accent/20 rounded-lg">
          <Code className="w-5 h-5 text-accent" />
        </div>
        <h3 className="text-lg font-semibold theme-text">Static Code Analysis</h3>
      </div>
      <p className="theme-text-secondary text-sm mb-3">
        Deep code inspection to identify security flaws before deployment. 
      </p>
      <ul className="space-y-2 flex-1">
        <li className="flex items-start space-x-2 text-sm theme-text-secondary">
          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
          <span>Multi-language support</span>
        </li>
        <li className="flex items-start space-x-2 text-sm theme-text-secondary">
          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
          <span>Security pattern matching</span>
        </li>
        <li className="flex items-start space-x-2 text-sm theme-text-secondary">
          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
          <span>False positive filtering</span>
        </li>
      </ul>
    </div>

    {/* Feature 3 - Git Integration */}
    <div className="theme-bg-subtle rounded-2xl border theme-border p-6 hover: border-accent/50 transition-all duration-300 flex flex-col">
      <div className="flex items-start space-x-3 mb-3">
        <div className="p-2 bg-accent/20 rounded-lg">
          <GitBranch className="w-5 h-5 text-accent" />
        </div>
        <h3 className="text-lg font-semibold theme-text">Git Platform Integration</h3>
      </div>
      <p className="theme-text-secondary text-sm mb-3">
        Seamless connection with your development workflow. 
      </p>
      <ul className="space-y-2 flex-1">
        <li className="flex items-start space-x-2 text-sm theme-text-secondary">
          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
          <span>GitHub, GitLab, Bitbucket support</span>
        </li>
        <li className="flex items-start space-x-2 text-sm theme-text-secondary">
          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
          <span>Pull request security gates</span>
        </li>
        <li className="flex items-start space-x-2 text-sm theme-text-secondary">
          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
          <span>Automated security checks</span>
        </li>
      </ul>
    </div>

    {/* Feature 4 - AI Assistant (Tall) */}
<div className="md:row-span-2 theme-bg-subtle rounded-2xl border theme-border p-6 hover: border-accent/50 transition-all duration-300 flex flex-col justify-center">
  <div className="flex items-start space-x-3 mb-3">
    <div className="p-2 bg-accent/20 rounded-lg">
      <Bot className="w-5 h-5 text-accent" />
    </div>
    <h3 className="text-lg font-semibold theme-text">AI Security Assistant</h3>
  </div>
  <p className="theme-text-secondary text-sm mb-4">
    Intelligent chatbot providing context-aware security guidance and remediation suggestions.
  </p>
  <div className="space-y-2">
    <div className="flex items-start space-x-2 theme-text-secondary">
      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
      <span className="text-sm">Smart vulnerability prioritization</span>
    </div>
    <div className="flex items-start space-x-2 theme-text-secondary">
      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
      <span className="text-sm">Automated fix suggestions</span>
    </div>
    <div className="flex items-start space-x-2 theme-text-secondary">
      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
      <span className="text-sm">Risk assessment scoring</span>
    </div>
    <div className="flex items-start space-x-2 theme-text-secondary">
      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
      <span className="text-sm">Context-aware code analysis</span>
    </div>
  </div>
</div>

    {/* Feature 5 - Real-Time Dashboards (Wide) */}
    <div className="md:col-span-2 theme-bg-subtle rounded-2xl border theme-border p-6 hover:border-accent/50 transition-all duration-300">
      <div className="flex items-start space-x-3 mb-3">
        <div className="p-2 bg-accent/20 rounded-lg">
          <TrendingUp className="w-5 h-5 text-accent" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold theme-text mb-2">Real-Time Dashboards & Analytics</h3>
          <p className="theme-text-secondary text-sm mb-3">
            Visualize your security posture with comprehensive analytics and actionable insights.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-sm theme-text-secondary">Security score trends</span>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-sm theme-text-secondary">Vulnerability distribution</span>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-sm theme-text-secondary">Compliance reporting</span>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-sm theme-text-secondary">Executive summaries</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Feature 6 - Team Workspaces (Wide with Screenshot) */}
    <div className="md:col-span-2 theme-bg-subtle rounded-2xl border theme-border p-6 hover:border-accent/50 transition-all duration-300">
      <div className="grid md:grid-cols-2 gap-6 items-center">
        <div>
          <div className="flex items-start space-x-3 mb-3">
            <div className="p-2 bg-accent/20 rounded-lg">
              <Users className="w-5 h-5 text-accent" />
            </div>
            <h3 className="text-lg font-semibold theme-text">Team Workspaces</h3>
          </div>
          <p className="theme-text-secondary text-sm mb-3">
            Collaborate effectively with powerful workspace management. 
          </p>
          <ul className="space-y-2">
            <li className="flex items-start space-x-2 text-sm theme-text-secondary">
              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
              <span>Role-based access control</span>
            </li>
            <li className="flex items-start space-x-2 text-sm theme-text-secondary">
              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
              <span>Multi-workspace management</span>
            </li>
            <li className="flex items-start space-x-2 text-sm theme-text-secondary">
              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
              <span>Team invitations & audit logs</span>
            </li>
          </ul>
        </div>
        <div className="flex justify-center">
          <img 
            src="/assets/team-workspaces-preview.png" 
            alt="Team Workspaces" 
            className="w-full max-w-xs h-auto rounded-lg border border-white/10 shadow-lg"
          />
        </div>
      </div>
    </div>
  </div>
</div>
           
            {/* Getting Started */}
<div className="bg-gray-100/80 dark: bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 shadow-2xl overflow-hidden mb-6">
  <div className="p-8 border-b theme-border">
    <h2 className="text-2xl font-bold theme-text mb-2">Getting Started</h2>
    <p className="theme-text-secondary">Set up SecureThread and secure your projects in minutes</p>
  </div>
  <div className="p-8">
    <div className="space-y-6">
      {/* Step 1: Authentication - IMAGE LEFT */}
      <div className="flex gap-4 items-start p-6 theme-bg-subtle rounded-xl border theme-border">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-bold">
            1
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold theme-text mb-4">Sign In with Git Provider</h3>
          <div className="grid md:grid-cols-2 gap-6 items-center">
            <div className="flex justify-center order-1 md:order-1">
              <img 
                src="/assets/signin-screenshot.png" 
                alt="Sign In Page" 
                className="w-full max-w-md h-auto rounded-lg border border-white/10 shadow-lg"
              />
            </div>
            <div className="order-2 md:order-2">
              <p className="theme-text-secondary leading-relaxed">
                Create your account or sign in using GitHub, GitLab, or Bitbucket OAuth authentication. 
                Securely connect with a single click. 
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Step 2: Create Workspace - IMAGE RIGHT */}
      <div className="flex gap-4 items-start p-6 theme-bg-subtle rounded-xl border theme-border">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-bold">
            2
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold theme-text mb-4">Create Workspace & Add Repositories</h3>
          <div className="grid md:grid-cols-2 gap-6 items-center">
            <div>
              <p className="theme-text-secondary leading-relaxed">
                Set up your workspace with specific repositories for your project. Add team members with 
                role-based permissions (Owner, Admin, Member, Viewer) to collaborate on security management.
              </p>
            </div>
            <div className="flex justify-center">
              <img 
                src="/assets/workspace-creation-screenshot.png" 
                alt="Workspace Creation" 
                className="w-full max-w-sm h-auto rounded-lg border border-white/10 shadow-lg"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Step 3: Scan & Analyze - IMAGE LEFT */}
      <div className="flex gap-4 items-start p-6 theme-bg-subtle rounded-xl border theme-border">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-bold">
            3
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold theme-text mb-4">Scan for Vulnerabilities</h3>
          <div className="grid md:grid-cols-2 gap-6 items-center">
            <div className="flex justify-center order-1 md:order-1">
              <img 
                src="/assets/scan-results-screenshot.png" 
                alt="Scan Results" 
                className="w-full max-w-sm h-auto rounded-lg border border-white/10 shadow-lg"
              />
            </div>
            <div className="order-2 md:order-2">
              <p className="theme-text-secondary leading-relaxed">
                Run comprehensive security scans on your projects. Add custom security rules tailored to 
                your organization's requirements. Analyze results with detailed reports and severity ratings.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Step 4: AI Chat & Remediation - IMAGE RIGHT */}
      <div className="flex gap-4 items-start p-6 theme-bg-subtle rounded-xl border theme-border">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-bold">
            4
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold theme-text mb-4">Use AI Chat for Analysis</h3>
          <div className="grid md:grid-cols-2 gap-6 items-center">
            <div>
              <p className="theme-text-secondary leading-relaxed">
                Leverage our AI-powered chatbot to find vulnerabilities in specific files or code snippets. 
                Get intelligent fix suggestions, generate comprehensive reports, and track remediation progress. 
              </p>
            </div>
            <div className="flex justify-center">
              <img 
                src="/assets/ai-chat-screenshot.png" 
                alt="AI Chat Interface" 
                className="w-full max-w-sm h-auto rounded-lg border border-white/10 shadow-lg"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

            {/* AI Assistant Section */}
            <div className="bg-gray-100/80 dark:bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 shadow-2xl overflow-hidden mb-6">
              <div className="p-8 border-b theme-border">
                <h2 className="text-2xl font-bold theme-text mb-2">AI-Powered Security Assistant</h2>
                <p className="theme-text-secondary">Get intelligent help with vulnerability remediation</p>
              </div>
              <div className="p-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center">
                        <MessageSquare className="w-7 h-7 text-accent" />
                      </div>
                      <h3 className="text-2xl font-semibold theme-text">Your Security Expert</h3>
                    </div>
                    <p className="theme-text-secondary mb-6">
                      Our AI assistant provides context-aware security guidance tailored to your codebase and vulnerabilities.
                    </p>
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg theme-bg-subtle">
                        <h4 className="font-semibold theme-text mb-2 flex items-center">
                          <Lightbulb className="w-5 h-5 inline mr-2 text-yellow-500" />
                          Smart Recommendations
                        </h4>
                        <p className="text-sm theme-text-secondary">
                          Get step-by-step fix instructions with code examples
                        </p>
                      </div>
                      <div className="p-4 rounded-lg theme-bg-subtle">
                        <h4 className="font-semibold theme-text mb-2 flex items-center">
                          <Activity className="w-5 h-5 inline mr-2 text-green-500" />
                          Context-Aware Analysis
                        </h4>
                        <p className="text-sm theme-text-secondary">
                          AI understands your project structure and provides relevant solutions
                        </p>
                      </div>
                      <div className="p-4 rounded-lg theme-bg-subtle">
                        <h4 className="font-semibold theme-text mb-2 flex items-center">
                          <Code className="w-5 h-5 inline mr-2 text-blue-500" />
                          Code Generation
                        </h4>
                        <p className="text-sm theme-text-secondary">
                          Generate secure code snippets to replace vulnerable patterns
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center">
                
                      <img 
                        src="/assets/ai-chat-screenshot2.png" 
                        alt="AI Chat Interface" 
                        className="w-full max-w-sm h-auto rounded-lg border border-white/10 shadow-lg"
                      />
                    
                  </div>
                </div>
              </div>
            </div>

            {/* Integrations */}
            <div className="bg-gray-100/80 dark:bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 shadow-2xl overflow-hidden mb-6">
              <div className="p-8 border-b theme-border">
                <h2 className="text-2xl font-bold theme-text mb-2">Platform Integrations</h2>
                <p className="theme-text-secondary">Connect SecureThread with your development workflow</p>
              </div>
              <div className="p-8">
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <div className="theme-bg-subtle rounded-xl p-6 border theme-border">
                    <div className="w-12 h-12 rounded-lg bg-gray-900 flex items-center justify-center mb-4">
                      <span className="text-2xl">🐙</span>
                    </div>
                    <h3 className="text-xl font-semibold theme-text mb-2">GitHub</h3>
                    <p className="theme-text-secondary text-sm mb-4">
                      Seamlessly import and scan your GitHub repositories
                    </p>
                    <ul className="space-y-2 text-sm theme-text-secondary">
                      <li className="flex items-start">
                        <ChevronRight className="w-4 h-4 text-accent mr-2 flex-shrink-0 mt-0.5" />
                        <span>OAuth authentication</span>
                      </li>
                      <li className="flex items-start">
                        <ChevronRight className="w-4 h-4 text-accent mr-2 flex-shrink-0 mt-0.5" />
                        <span>Automatic repository sync</span>
                      </li>
                      <li className="flex items-start">
                        <ChevronRight className="w-4 h-4 text-accent mr-2 flex-shrink-0 mt-0.5" />
                        <span>Pull request checks</span>
                      </li>
                    </ul>
                  </div>

                  <div className="theme-bg-subtle rounded-xl p-6 border theme-border">
                    <div className="w-12 h-12 rounded-lg bg-orange-600 flex items-center justify-center mb-4">
                      <span className="text-2xl">🦊</span>
                    </div>
                    <h3 className="text-xl font-semibold theme-text mb-2">GitLab</h3>
                    <p className="theme-text-secondary text-sm mb-4">
                      Integrate with GitLab for comprehensive security scanning
                    </p>
                    <ul className="space-y-2 text-sm theme-text-secondary">
                      <li className="flex items-start">
                        <ChevronRight className="w-4 h-4 text-accent mr-2 flex-shrink-0 mt-0.5" />
                        <span>OAuth authentication</span>
                      </li>
                      <li className="flex items-start">
                        <ChevronRight className="w-4 h-4 text-accent mr-2 flex-shrink-0 mt-0.5" />
                        <span>Project import and scanning</span>
                      </li>
                      <li className="flex items-start">
                        <ChevronRight className="w-4 h-4 text-accent mr-2 flex-shrink-0 mt-0.5" />
                        <span>Merge request checks</span>
                      </li>
                    </ul>
                  </div>

                  <div className="theme-bg-subtle rounded-xl p-6 border theme-border">
                    <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center mb-4">
                      <span className="text-2xl">⚡</span>
                    </div>
                    <h3 className="text-xl font-semibold theme-text mb-2">Bitbucket</h3>
                    <p className="theme-text-secondary text-sm mb-4">
                      Scan Bitbucket repositories with ease
                    </p>
                    <ul className="space-y-2 text-sm theme-text-secondary">
                      <li className="flex items-start">
                        <ChevronRight className="w-4 h-4 text-accent mr-2 flex-shrink-0 mt-0.5" />
                        <span>OAuth authentication</span>
                      </li>
                      <li className="flex items-start">
                        <ChevronRight className="w-4 h-4 text-accent mr-2 flex-shrink-0 mt-0.5" />
                        <span>Repository sync</span>
                      </li>
                      <li className="flex items-start">
                        <ChevronRight className="w-4 h-4 text-accent mr-2 flex-shrink-0 mt-0.5" />
                        <span>Pull request integration</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

                
            {/* User Guide */}
            <div className="bg-gray-100/80 dark:bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 shadow-2xl overflow-hidden mb-6">
              <div className="p-8 border-b theme-border">
                <h2 className="text-2xl font-bold theme-text mb-2">User Guide</h2>
                <p className="theme-text-secondary">Learn how to use SecureThread effectively</p>
              </div>
              <div className="p-8">
                <div className="space-y-8">
                  {/* Guide Section 1 */}
                  <div>
                    <h3 className="text-xl font-semibold theme-text mb-4">Understanding Scan Results</h3>
                    <div className="grid md:grid-cols-4 gap-4 mb-6">
                      <div className="p-4 rounded-lg border-l-4 border-red-500 theme-bg-subtle">
                        <AlertTriangle className="w-6 h-6 text-red-500 mb-2" />
                        <h4 className="font-semibold theme-text mb-1">Critical</h4>
                        <p className="text-sm theme-text-secondary">Requires immediate attention</p>
                      </div>
                      <div className="p-4 rounded-lg border-l-4 border-orange-500 theme-bg-subtle">
                        <AlertTriangle className="w-6 h-6 text-orange-500 mb-2" />
                        <h4 className="font-semibold theme-text mb-1">High</h4>
                        <p className="text-sm theme-text-secondary">Fix as soon as possible</p>
                      </div>
                      <div className="p-4 rounded-lg border-l-4 border-yellow-500 theme-bg-subtle">
                        <AlertTriangle className="w-6 h-6 text-yellow-500 mb-2" />
                        <h4 className="font-semibold theme-text mb-1">Medium</h4>
                        <p className="text-sm theme-text-secondary">Schedule for remediation</p>
                      </div>
                      <div className="p-4 rounded-lg border-l-4 border-blue-500 theme-bg-subtle">
                        <AlertTriangle className="w-6 h-6 text-blue-500 mb-2" />
                        <h4 className="font-semibold theme-text mb-1">Low</h4>
                        <p className="text-sm theme-text-secondary">Low priority fixes</p>
                      </div>
                    </div>
                  </div>

                  {/* Guide Section 2 - Managing Workspaces with Accordion */}
                  <div>
                    <h3 className="text-xl font-semibold theme-text mb-4">Managing Workspaces</h3>
                    <div className="theme-bg-subtle rounded-lg border theme-border overflow-hidden">
                      
                      {/* Accordion Item 1 - Creating a Workspace */}
                      <div className="border-b theme-border">
                        <button
                          onClick={() => toggleAccordion('create-workspace')}
                          className="w-full flex items-center justify-between p-5 hover:bg-gray-200/50 dark:hover:bg-white/5 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <Settings className="w-5 h-5 text-accent" />
                            <h4 className="font-semibold theme-text text-left">Creating a Workspace</h4>
                          </div>
                          <ChevronRight 
                            className={`w-5 h-5 theme-text-muted transition-transform duration-200 ${
                              openAccordion === 'create-workspace' ? 'rotate-90' : ''
                            }`}
                          />
                        </button>
                        {openAccordion === 'create-workspace' && (
                          <div className="p-5 pt-0 animate-fadeIn">
                            <ol className="space-y-2 theme-text-secondary list-decimal list-inside ml-2">
                              <li>Click workspace dropdown in the top navigation</li>
                              <li>Select "Create New Workspace"</li>
                              <li>Enter workspace name and select repositories</li>
                              <li>Click "Create Workspace"</li>
                            </ol>
                          </div>
                        )}
                      </div>

                      {/* Accordion Item 2 - Inviting Team Members */}
                      <div>
                        <button
                          onClick={() => toggleAccordion('invite-members')}
                          className="w-full flex items-center justify-between p-5 hover:bg-gray-200/50 dark: hover:bg-white/5 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <Users className="w-5 h-5 text-accent" />
                            <h4 className="font-semibold theme-text text-left">Inviting Team Members</h4>
                          </div>
                          <ChevronRight 
                            className={`w-5 h-5 theme-text-muted transition-transform duration-200 ${
                              openAccordion === 'invite-members' ? 'rotate-90' : ''
                            }`}
                          />
                        </button>
                        {openAccordion === 'invite-members' && (
                          <div className="p-5 pt-0 animate-fadeIn">
                            <ol className="space-y-2 theme-text-secondary list-decimal list-inside ml-2">
                              <li>Navigate to Workspace Settings</li>
                              <li>Click "Team" tab</li>
                              <li>Click "Invite Members"</li>
                              <li>Enter email addresses or generate invite link</li>
                              <li>Select role (Owner, Admin, Member, Viewer)</li>
                              <li>Send invitations</li>
                            </ol>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            </div>    

            

            {/* Call to Action */}
            <div className="bg-gradient-to-r from-accent/20 to-accent/40 backdrop-blur-lg rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-accent/30 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <ArrowRight className="w-8 h-8 text-accent" />
                </div>
                <h2 className="text-3xl font-bold theme-text mb-4">Ready to Secure Your Code?</h2>
                <p className="text-lg theme-text-secondary mb-8 max-w-2xl mx-auto">
                  Start scanning your repositories for vulnerabilities today. Join thousands of developers 
                  who trust SecureThread to keep their code secure.
                </p>
                <div className="flex flex-col sm: flex-row gap-4 justify-center">
                  <Button className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-6 text-lg">
                    <Play className="w-5 h-5 mr-2" />
                    Get Started Free
                  </Button>
                  <Button variant="outline" className="border-white/20 theme-text hover:bg-gray-100/80 dark:hover:bg-white/20 px-8 py-6 text-lg">
                    <BookOpen className="w-5 h-5 mr-2" />
                    View Full Docs
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Docs;