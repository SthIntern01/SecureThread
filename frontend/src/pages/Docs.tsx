import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EtherealBackground } from "../components/ui/ethereal-background";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { useAuth } from "../contexts/AuthContext";
import {
  Search,
  ChevronRight,
  BookOpen,
  Shield,
  Code,
  Zap,
  Eye,
  Settings,
  Users,
  GitBranch,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  ExternalLink,
  Copy,
  Play,
  Terminal,
  Globe,
  Lock,
  TrendingUp,
  FileText,
  Monitor,
  Bot,
  Webhook,
} from "lucide-react";
import {
  IconDashboard,
  IconFolder,
  IconUsers,
  IconBrandGithub,
  IconCircleCheck,
  IconMessageCircle,
  IconSettings,
  IconBook,
  IconHelp,
  IconUser,
  IconLogout,
  IconRobot,
} from "@tabler/icons-react";

const Logo = () => {
  return (
    <Link
      to="/"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal"
    >
      <span className="font-medium text-brand-light">SECURE THREAD</span>
    </Link>
  );
};

const ResponsiveSidebar = ({
  sidebarOpen,
  setSidebarOpen,
}: {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}) => {
  const { user, logout } = useAuth();
  const [showLogout, setShowLogout] = useState(false);

  const feedLinks = [
    {
      label: "Dashboard",
      href: "/",
      icon: <IconDashboard className="h-5 w-5 shrink-0" />,
      active: false,
    },
    {
      label: "Projects",
      href: "/projects",
      icon: <IconFolder className="h-5 w-5 shrink-0" />,
      active: false,
    },
    {
      label: "Members",
      href: "/members",
      icon: <IconUsers className="h-5 w-5 shrink-0" />,
      active: false,
    },
    {
      label: "Integrations",
      href: "/integrations",
      icon: <IconBrandGithub className="h-5 w-5 shrink-0" />,
      active: false,
      count: "99+",
    },
    {
      label: "AI Chat",
      href: "/ai-chat",
      icon: <IconRobot className="h-5 w-5 shrink-0" />,
      active: false,
    },
    {
      label: "Solved",
      href: "/solved",
      icon: <IconCircleCheck className="h-5 w-5 shrink-0" />,
      active: false,
    },
  ];

  const bottomLinks = [
    {
      label: "Feedback",
      href: "#",
      icon: <IconMessageCircle className="h-5 w-5 shrink-0" />,
    },
    {
      label: "Settings",
      href: "/settings",
      icon: <IconSettings className="h-5 w-5 shrink-0" />,
    },
    {
      label: "Docs",
      href: "/docs",
      icon: <IconBook className="h-5 w-5 shrink-0" />,
      active: true, // Set to true since this is the Docs page
    },
    {
      label: "Help",
      href: "#",
      icon: <IconHelp className="h-5 w-5 shrink-0" />,
    },
  ];

  const profileLink = {
    label: user?.full_name || user?.github_username || "User",
    href: "#",
    icon: user?.avatar_url ? (
      <img
        src={user.avatar_url}
        alt={user.full_name || user.github_username}
        className="h-5 w-5 rounded-full shrink-0"
      />
    ) : (
      <IconUser className="h-5 w-5 shrink-0" />
    ),
  };

  const handleProfileClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowLogout(!showLogout);
  };

  return (
    <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
      <SidebarBody className="justify-between gap-10">
        <div className="flex flex-1 flex-col">
          <Logo />

          <div className="mt-8 flex flex-col gap-2">
            {feedLinks.map((link, idx) => (
              <SidebarLink key={idx} link={link} />
            ))}
          </div>

          <div className="mt-auto flex flex-col gap-2">
            {bottomLinks.map((link, idx) => (
              <SidebarLink key={idx} link={link} />
            ))}
          </div>

          <div className="pt-4 border-t border-brand-gray/30 relative">
            <div onClick={handleProfileClick} className="cursor-pointer">
              <SidebarLink link={profileLink} />
            </div>

            {showLogout && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                <button
                  onClick={() => {
                    logout();
                    setShowLogout(false);
                  }}
                  className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <IconLogout className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </SidebarBody>
    </Sidebar>
  );
};

const FeatureCard = ({ icon, title, description, features }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  features: string[];
}) => (
  <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:bg-white/10 transition-all duration-300">
    <div className="flex items-center space-x-3 mb-4">
      <div className="p-3 bg-accent/20 rounded-xl">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-white">{title}</h3>
    </div>
    <p className="text-white/80 mb-4">{description}</p>
    <ul className="space-y-2">
      {features.map((feature, idx) => (
        <li key={idx} className="flex items-center space-x-2 text-sm text-white/70">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <span>{feature}</span>
        </li>
      ))}
    </ul>
  </div>
);

const QuickStartCard = ({ title, description, steps, codeExample }: {
  title: string;
  description: string;
  steps: string[];
  codeExample?: string;
}) => (
  <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
    <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
    <p className="text-white/80 mb-4">{description}</p>
    
    <div className="space-y-3 mb-6">
      {steps.map((step, idx) => (
        <div key={idx} className="flex items-start space-x-3">
          <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center text-xs font-semibold text-accent-foreground">
            {idx + 1}
          </div>
          <p className="text-white/90 text-sm pt-0.5">{step}</p>
        </div>
      ))}
    </div>

    {codeExample && (
      <div className="bg-black/30 rounded-lg p-4 border border-white/10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-white/60" />
            <span className="text-xs text-white/60">Terminal</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-white/60 hover:text-white"
          >
            <Copy className="w-3 h-3" />
          </Button>
        </div>
        <code className="text-sm text-green-400 font-mono">{codeExample}</code>
      </div>
    )}
  </div>
);

const Docs = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const features = [
    {
      icon: <Shield className="w-6 h-6 text-accent" />,
      title: "Vulnerability Detection",
      description: "Advanced security scanning for code repositories and dependencies",
      features: [
        "Real-time vulnerability scanning",
        "OWASP Top 10 detection",
        "Dependency vulnerability analysis",
        "Custom security rule creation"
      ]
    },
    {
      icon: <Code className="w-6 h-6 text-accent" />,
      title: "Code Analysis",
      description: "Deep static analysis to identify security flaws in your codebase",
      features: [
        "Static Application Security Testing (SAST)",
        "Secret detection and prevention",
        "Code quality and security metrics",
        "Multi-language support"
      ]
    },
    {
      icon: <GitBranch className="w-6 h-6 text-accent" />,
      title: "CI/CD Integration",
      description: "Seamless integration with your development workflow",
      features: [
        "GitHub, GitLab, Bitbucket support",
        "Pull request security checks",
        "Automated security gates",
        "DevSecOps pipeline integration"
      ]
    },
    {
      icon: <Bot className="w-6 h-6 text-accent" />,
      title: "AI-Powered Insights",
      description: "Intelligent vulnerability analysis and remediation suggestions",
      features: [
        "Smart vulnerability prioritization",
        "Automated fix suggestions",
        "Context-aware security advice",
        "Risk assessment scoring"
      ]
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-accent" />,
      title: "Security Analytics",
      description: "Comprehensive security posture monitoring and reporting",
      features: [
        "Security trend analysis",
        "Compliance reporting",
        "Executive dashboards",
        "Custom security metrics"
      ]
    },
    {
      icon: <Users className="w-6 h-6 text-accent" />,
      title: "Team Collaboration",
      description: "Collaborative security management for development teams",
      features: [
        "Role-based access control",
        "Security issue assignments",
        "Team notifications",
        "Audit trail logging"
      ]
    }
  ];

  const quickStartGuides = [
    {
      title: "Getting Started",
      description: "Set up SecureThread in minutes and start securing your code",
      steps: [
        "Create your SecureThread account",
        "Connect your code repositories",
        "Configure security scanning preferences",
        "Run your first security scan"
      ]
    },
    {
      title: "GitHub Integration",
      description: "Connect SecureThread with your GitHub repositories",
      steps: [
        "Go to Integrations page",
        "Click 'Connect GitHub'",
        "Authorize SecureThread app",
        "Select repositories to scan"
      ],
      codeExample: "git clone https://github.com/your-org/your-repo.git"
    },
    {
      title: "CLI Installation",
      description: "Use SecureThread CLI for local development",
      steps: [
        "Install SecureThread CLI globally",
        "Authenticate with your API key",
        "Run security scan in your project",
        "Review and fix vulnerabilities"
      ],
      codeExample: "npm install -g @securethread/cli && securethread scan"
    }
  ];

  return (
    <div className="w-full h-screen font-sans relative flex overflow-hidden">
      <EtherealBackground
        color="rgba(255, 255, 255, 0.6)"
        animation={{ scale: 100, speed: 90 }}
        noise={{ opacity: 0.8, scale: 1.2 }}
        sizing="fill"
      />

      <ResponsiveSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <div className="flex-1 overflow-y-auto overflow-x-hidden relative z-10">
        <div className="p-4 lg:p-6">
          <div className="max-w-6xl mx-auto">
            {/* Header Container */}
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 shadow-2xl overflow-hidden mb-6">
              {/* Header Section */}
              <div className="p-8 border-b border-white/10">
                {/* Breadcrumb */}
                <div className="flex items-center space-x-2 text-sm mb-4">
                  <span className="font-medium text-white">SecureThread</span>
                  <ChevronRight size={16} className="text-white/60" />
                  <span className="font-medium text-white">Documentation</span>
                </div>

                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
                      Documentation
                    </h1>
                    <p className="text-white/80">
                      Everything you need to secure your applications with SecureThread
                    </p>
                  </div>
                  <div className="mt-6 lg:mt-0 flex space-x-3">
                    <Button
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10"
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

              {/* Search Section */}
              <div className="p-8">
                <div className="relative max-w-lg mx-auto">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
                  <Input
                    placeholder="Search documentation..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 text-lg"
                  />
                </div>
              </div>
            </div>

            {/* What is SecureThread */}
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 shadow-2xl overflow-hidden mb-6">
              <div className="p-8">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-accent/20 to-accent/40 rounded-full mx-auto mb-6 flex items-center justify-center">
                    <Shield className="w-10 h-10 text-accent" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-4">What is SecureThread?</h2>
                  <p className="text-xl text-white/80 max-w-4xl mx-auto leading-relaxed">
                    SecureThread is a comprehensive vulnerability management platform that helps development teams 
                    identify, prioritize, and remediate security vulnerabilities in their applications and infrastructure. 
                    Similar to industry leaders like Snyk and Aikido, we provide continuous security monitoring, 
                    intelligent threat detection, and seamless DevSecOps integration.
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <div className="text-center p-6 bg-white/5 rounded-2xl border border-white/10">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-xl mx-auto mb-4 flex items-center justify-center">
                      <Eye className="w-6 h-6 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Continuous Monitoring</h3>
                    <p className="text-white/70 text-sm">24/7 security monitoring across your entire application stack</p>
                  </div>
                  <div className="text-center p-6 bg-white/5 rounded-2xl border border-white/10">
                    <div className="w-12 h-12 bg-red-500/20 rounded-xl mx-auto mb-4 flex items-center justify-center">
                      <Zap className="w-6 h-6 text-red-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Rapid Response</h3>
                    <p className="text-white/70 text-sm">Instant alerts and automated remediation for critical vulnerabilities</p>
                  </div>
                  <div className="text-center p-6 bg-white/5 rounded-2xl border border-white/10">
                    <div className="w-12 h-12 bg-green-500/20 rounded-xl mx-auto mb-4 flex items-center justify-center">
                      <Lock className="w-6 h-6 text-green-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Zero Trust Security</h3>
                    <p className="text-white/70 text-sm">Comprehensive security coverage from code to cloud</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Features Grid */}
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 shadow-2xl overflow-hidden mb-6">
              <div className="p-8 border-b border-white/10">
                <h2 className="text-2xl font-bold text-white mb-2">Core Features</h2>
                <p className="text-white/80">Comprehensive security tools for modern development teams</p>
              </div>
              <div className="p-8">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {features.map((feature, idx) => (
                    <FeatureCard key={idx} {...feature} />
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Start Guides */}
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 shadow-2xl overflow-hidden mb-6">
              <div className="p-8 border-b border-white/10">
                <h2 className="text-2xl font-bold text-white mb-2">Quick Start Guides</h2>
                <p className="text-white/80">Get up and running with SecureThread in minutes</p>
              </div>
              <div className="p-8">
                <div className="grid md:grid-cols-3 gap-6">
                  {quickStartGuides.map((guide, idx) => (
                    <QuickStartCard key={idx} {...guide} />
                  ))}
                </div>
              </div>
            </div>

            {/* Security Standards */}
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 shadow-2xl overflow-hidden mb-6">
              <div className="p-8 border-b border-white/10">
                <h2 className="text-2xl font-bold text-white mb-2">Security Standards & Compliance</h2>
                <p className="text-white/80">Built with industry-leading security frameworks</p>
              </div>
              <div className="p-8">
                <div className="grid md:grid-cols-4 gap-6">
                  {[
                    { name: "OWASP Top 10", icon: <Shield className="w-8 h-8 text-red-400" /> },
                    { name: "NIST Framework", icon: <FileText className="w-8 h-8 text-blue-400" /> },
                    { name: "SOC 2 Type II", icon: <CheckCircle className="w-8 h-8 text-green-400" /> },
                    { name: "ISO 27001", icon: <Globe className="w-8 h-8 text-purple-400" /> },
                  ].map((standard, idx) => (
                    <div key={idx} className="text-center p-6 bg-white/5 rounded-2xl border border-white/10">
                      <div className="mb-4">{standard.icon}</div>
                      <h3 className="font-semibold text-white">{standard.name}</h3>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Integration Examples */}
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 shadow-2xl overflow-hidden mb-6">
              <div className="p-8 border-b border-white/10">
                <h2 className="text-2xl font-bold text-white mb-2">Popular Integrations</h2>
                <p className="text-white/80">Connect SecureThread with your existing development tools</p>
              </div>
              <div className="p-8">
                <div className="grid md:grid-cols-6 gap-4">
                  {[
                    { name: "GitHub", icon: "🐙" },
                    { name: "GitLab", icon: "🦊" },
                    { name: "Jenkins", icon: "⚙️" },
                    { name: "Docker", icon: "🐳" },
                    { name: "Kubernetes", icon: "⚓" },
                    { name: "AWS", icon: "☁️" },
                  ].map((integration, idx) => (
                    <div key={idx} className="text-center p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
                      <div className="text-2xl mb-2">{integration.icon}</div>
                      <p className="text-sm font-medium text-white">{integration.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="bg-gradient-to-r from-accent/20 to-accent/40 backdrop-blur-lg rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-accent/30 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <ArrowRight className="w-8 h-8 text-accent" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">Ready to Secure Your Code?</h2>
                <p className="text-white/80 mb-6 max-w-2xl mx-auto">
                  Start your free trial today and experience enterprise-grade security 
                  that scales with your development team.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                    <Play className="w-4 h-4 mr-2" />
                    Start Free Trial
                  </Button>
                  <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                    <BookOpen className="w-4 h-4 mr-2" />
                    View API Docs
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