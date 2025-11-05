import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EtherealBackground } from "../components/ui/ethereal-background";
import AppSidebar from "@/components/AppSidebar";
import { useAuth } from "../contexts/AuthContext";
import {
  ChevronRight,
  Search,
  BookOpen,
  Settings,
  Shield,
  Users,
  CreditCard,
  AlertCircle,
  ExternalLink,
  MessageCircle,
  FileText,
  Play,
  CheckCircle,
  Zap,
  UserCheck,
} from "lucide-react";
import {
 IconUser,
} from "@tabler/icons-react";



const Help = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const helpCategories = [
    {
      title: "Getting Started",
      description: "Basic setup, onboarding, first scan",
      icon: Play,
      color: "text-green-500",
      bgColor: "bg-green-500/20",
      articles: 12,
    },
    {
      title: "Account & Settings",
      description: "Profile, roles, permissions, security settings",
      icon: Settings,
      color: "text-blue-500",
      bgColor: "bg-blue-500/20",
      articles: 8,
    },
    {
      title: "Scanning Issues",
      description: "Common problems, false positives, scan delays",
      icon: AlertCircle,
      color: "text-red-500",
      bgColor: "bg-red-500/20",
      articles: 15,
    },
    {
      title: "Policies & Compliance",
      description: "Rules, compliance checks, severity levels",
      icon: Shield,
      color: "text-purple-500",
      bgColor: "bg-purple-500/20",
      articles: 10,
    },
    {
      title: "Team & Collaboration",
      description: "Adding users, managing teams",
      icon: Users,
      color: "text-orange-500",
      bgColor: "bg-orange-500/20",
      articles: 6,
    },
    {
      title: "Billing & Subscription",
      description: "Plans, invoices, upgrades",
      icon: CreditCard,
      color: "text-teal-500",
      bgColor: "bg-teal-500/20",
      articles: 5,
    },
  ];

  const popularArticles = [
    {
      title: "How to set up your first project",
      description: "Step-by-step guide to creating and configuring your first vulnerability scan project",
      readTime: "5 min read",
      category: "Getting Started",
      icon: Play,
    },
    {
      title: "Understanding severity levels",
      description: "Learn about critical, high, medium, and low severity classifications",
      readTime: "3 min read",
      category: "Policies & Compliance",
      icon: Shield,
    },
    {
      title: "Troubleshooting failed scans",
      description: "Common reasons why scans fail and how to resolve them quickly",
      readTime: "7 min read",
      category: "Scanning Issues",
      icon: AlertCircle,
    },
    {
      title: "Managing user roles and permissions",
      description: "Configure team access levels and permission settings effectively",
      readTime: "4 min read",
      category: "Account & Settings",
      icon: UserCheck,
    },
    {
      title: "Setting up automated scans",
      description: "Configure recurring scans and notification preferences",
      readTime: "6 min read",
      category: "Getting Started",
      icon: Zap,
    },
    {
      title: "Integrating with CI/CD pipelines",
      description: "Connect SecureThread with your development workflow",
      readTime: "8 min read",
      category: "Team & Collaboration",
      icon: Users,
    },
  ];

  return (
    <div className="w-full h-screen font-sans relative flex overflow-hidden">
      <EtherealBackground
        color="rgba(255, 255, 255, 0.6)"
        animation={{ scale: 100, speed: 90 }}
        noise={{ opacity: 0.8, scale: 1.2 }}
        sizing="fill"
      />

      <AppSidebar
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
    />

      <div className="flex-1 overflow-y-auto overflow-x-hidden relative z-10">
        <div className="p-4 lg:p-6">
          <div className="max-w-6xl mx-auto">
            {/* Single unified container */}
            <div className="bg-gray-100/80 dark:bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
              
              {/* Header Section */}
              <div className="p-8 border-b theme-border">
                {/* Breadcrumb */}
                <div className="flex items-center space-x-2 text-sm mb-4">
                  <span className="font-medium theme-text">SecureThread</span>
                  <ChevronRight size={16} className="theme-text-muted" />
                  <span className="font-medium theme-text">Help</span>
                </div>

                <div className="text-center">
                  <h1 className="text-3xl lg:text-4xl font-bold theme-text mb-4">
                    Help & Support
                  </h1>
                  <p className="theme-text-secondary text-lg max-w-2xl mx-auto mb-8">
                    Find answers, troubleshoot issues, and get support for using our vulnerability management platform.
                  </p>
                  
                  {/* Search Bar */}
                  <div className="relative max-w-2xl mx-auto">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 theme-text-muted" />
                    </div>
                    <Input
                      type="text"
                      placeholder="Search help articles, FAQs, or troubleshooting guides…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-gray-100/80 dark:bg-white/10 border border-white/20 rounded-lg theme-text placeholder:text-white/50 text-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Help Categories Section */}
              <div className="p-8 border-b theme-border">
                <h2 className="text-2xl font-bold theme-text mb-6">Browse by Category</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {helpCategories.map((category, index) => {
                    const IconComponent = category.icon;
                    return (
                      <button
                        key={index}
                        className="p-6 theme-bg-subtle border border-white/20 rounded-lg hover:bg-gray-100/80 dark:bg-white/10 transition-all text-left group"
                      >
                        <div className="flex items-start space-x-4">
                          <div className={`w-12 h-12 ${category.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                            <IconComponent className={`w-6 h-6 ${category.color}`} />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold theme-text mb-2 group-hover:text-accent transition-colors">
                              {category.title}
                            </h3>
                            <p className="text-white/70 text-sm mb-3">
                              {category.description}
                            </p>
                            <div className="flex items-center space-x-2">
                              <Badge variant="secondary" className="text-xs bg-gray-100/80 dark:bg-white/10 theme-text-secondary">
                                {category.articles} articles
                              </Badge>
                              <ExternalLink className="w-4 h-4 text-white/50 group-hover:text-accent transition-colors" />
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Popular Articles Section */}
              <div className="p-8 border-b theme-border">
                <h2 className="text-2xl font-bold theme-text mb-6">Popular Help Articles</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {popularArticles.map((article, index) => {
                    const IconComponent = article.icon;
                    return (
                      <button
                        key={index}
                        className="p-5 theme-bg-subtle border border-white/20 rounded-lg hover:bg-gray-100/80 dark:bg-white/10 transition-all text-left group"
                      >
                        <div className="flex items-start space-x-4">
                          <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <IconComponent className="w-4 h-4 text-accent" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold theme-text mb-2 group-hover:text-accent transition-colors">
                              {article.title}
                            </h3>
                            <p className="text-white/70 text-sm mb-3">
                              {article.description}
                            </p>
                            <div className="flex items-center space-x-3 text-xs">
                              <Badge variant="outline" className="border-white/30 theme-text-muted">
                                {article.category}
                              </Badge>
                              <span className="text-white/50">{article.readTime}</span>
                            </div>
                          </div>
                          <ExternalLink className="w-4 h-4 text-white/50 group-hover:text-accent transition-colors" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Still Need Help CTA Section */}
              <div className="p-8 bg-accent/10 border-t theme-border">
                <div className="text-center">
                  <div className="w-16 h-16 bg-accent/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <MessageCircle className="w-8 h-8 text-accent" />
                  </div>
                  <h3 className="text-2xl font-bold theme-text mb-2">
                    Can't find what you're looking for?
                  </h3>
                  <p className="theme-text-secondary mb-6 max-w-md mx-auto">
                    Our support team is here to help you with any questions or issues you might have.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button className="bg-accent hover:bg-accent/90 text-accent-foreground px-6 py-3">
                      <MessageCircle className="w-5 h-5 mr-2" />
                      Contact Support
                    </Button>
                    <Button variant="outline" className="border-white/20 theme-text hover:bg-gray-100/80 dark:bg-white/10 px-6 py-3">
                      <FileText className="w-5 h-5 mr-2" />
                      Submit a Ticket
                    </Button>
                  </div>
                  <div className="mt-6 pt-6 border-t theme-border">
                    <div className="flex items-center justify-center space-x-6 text-sm text-white/70">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span>24/7 Support</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span>Average 2hr Response</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span>Expert Team</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;