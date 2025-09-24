"use client";

import React, { useState, useEffect, useRef, useCallback, useTransition } from 'react';
import { EtherealBackground } from '../components/ui/ethereal-background';
import AppSidebar from "../components/AppSidebar";
import { ChevronRight } from 'lucide-react';
import { cn } from "@/lib/utils";
import {
  ImageIcon,
  FileUp,
  Figma,
  MonitorIcon,
  CircleUserRound,
  ArrowUpIcon,
  Paperclip,
  PlusIcon,
  SendIcon,
  XIcon,
  LoaderIcon,
  Sparkles,
  Command,
  FileText,
  AlertTriangle,
  CheckCircle,
  Upload,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { aiChatService, ChatMessage, ChatResponse, FileAnalysis } from "@/services/aiChatService";
import { useAuth } from "../contexts/AuthContext";
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
  IconRobot,
} from '@tabler/icons-react';

interface UseAutoResizeTextareaProps {
  minHeight: number;
  maxHeight?: number;
}

function useAutoResizeTextarea({
  minHeight,
  maxHeight,
}: UseAutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      if (reset) {
        textarea.style.height = `${minHeight}px`;
        return;
      }

      textarea.style.height = `${minHeight}px`;
      const newHeight = Math.max(
        minHeight,
        Math.min(
          textarea.scrollHeight,
          maxHeight ?? Number.POSITIVE_INFINITY
        )
      );

      textarea.style.height = `${newHeight}px`;
    },
    [minHeight, maxHeight]
  );

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = `${minHeight}px`;
    }
  }, [minHeight]);

  useEffect(() => {
    const handleResize = () => adjustHeight();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [adjustHeight]);

  return { textareaRef, adjustHeight };
}

interface CommandSuggestion {
  icon: React.ReactNode;
  label: string;
  description: string;
  prefix: string;
}

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  containerClassName?: string;
  showRing?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, containerClassName, showRing = true, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    return (
      <div className={cn(
        "relative",
        containerClassName
      )}>
        <textarea
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
            "transition-all duration-200 ease-in-out",
            "placeholder:text-muted-foreground",
            "disabled:cursor-not-allowed disabled:opacity-50",
            showRing ? "focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0" : "",
            className
          )}
          ref={ref}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {showRing && isFocused && (
          <motion.span
            className="absolute inset-0 rounded-md pointer-events-none ring-2 ring-offset-0 ring-violet-500/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

function TypingDots() {
  return (
    <div className="flex items-center ml-1">
      {[1, 2, 3].map((dot) => (
        <motion.div
          key={dot}
          className="w-1.5 h-1.5 bg-white/90 rounded-full mx-0.5"
          initial={{ opacity: 0.3 }}
          animate={{
            opacity: [0.3, 0.9, 0.3],
            scale: [0.85, 1.1, 0.85]
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: dot * 0.15,
            ease: "easeInOut",
          }}
          style={{
            boxShadow: "0 0 4px rgba(255, 255, 255, 0.3)"
          }}
        />
      ))}
    </div>
  );
}

interface AttachedFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

interface FileUploadAreaProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
}

function FileUploadArea({ onFilesSelected, maxFiles = 5 }: FileUploadAreaProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files).slice(0, maxFiles);
    if (files.length > 0) {
      onFilesSelected(files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, maxFiles);
    if (files.length > 0) {
      onFilesSelected(files);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div
      className={cn(
        "border-2 border-dashed border-white/20 rounded-lg p-6 text-center transition-all duration-200",
        isDragOver ? "border-violet-400 bg-violet-500/10" : "hover:border-white/30"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".py,.js,.jsx,.ts,.tsx,.php,.java,.cpp,.c,.cs,.rb,.go,.rs,.swift,.sql,.sh,.bash,.yaml,.yml,.json,.xml,.html,.css"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <div className="space-y-3">
        <Upload className="w-12 h-12 text-white/40 mx-auto" />
        <div>
          <p className="text-white/70 text-sm">
            Drop your code files here or{' '}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-violet-400 hover:text-violet-300 underline"
            >
              browse
            </button>
          </p>
          <p className="text-white/40 text-xs mt-1">
            Supports: .py, .js, .ts, .php, .java and more • Max {maxFiles} files • 10MB each
          </p>
        </div>
      </div>
    </div>
  );
}

function FileAnalysisResults({ analyses }: { analyses: FileAnalysis[] }) {
  return (
    <div className="space-y-3">
      <h4 className="text-white/90 font-medium text-sm">📁 File Analysis Results</h4>
      {analyses.map((analysis, index) => (
        <div
          key={index}
          className="bg-white/5 rounded-lg p-3 border border-white/10"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-white/60" />
              <span className="text-white/90 text-sm font-medium">
                {analysis.file_name}
              </span>
            </div>
            {analysis.error ? (
              <div className="flex items-center gap-1 text-red-400">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-xs">Error</span>
              </div>
            ) : analysis.vulnerability_count > 0 ? (
              <div className="flex items-center gap-1 text-orange-400">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-xs">{analysis.vulnerability_count} issues</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-green-400">
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs">Clean</span>
              </div>
            )}
          </div>
          
          {analysis.error ? (
            <p className="text-red-400 text-xs">{analysis.error}</p>
          ) : (
            <div className="space-y-1">
              <p className="text-white/60 text-xs">
                Size: {(analysis.file_size / 1024).toFixed(1)}KB
              </p>
              {analysis.vulnerability_count > 0 && (
                <div className="space-y-1">
                  {analysis.vulnerabilities?.slice(0, 2).map((vuln, vIndex) => (
                    <div key={vIndex} className="bg-white/5 rounded p-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded",
                          vuln.severity === 'critical' ? "bg-red-500/20 text-red-300" :
                          vuln.severity === 'high' ? "bg-orange-500/20 text-orange-300" :
                          vuln.severity === 'medium' ? "bg-yellow-500/20 text-yellow-300" :
                          "bg-blue-500/20 text-blue-300"
                        )}>
                          {vuln.severity?.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-white/80 text-xs font-medium">{vuln.title}</p>
                      {vuln.line_number && (
                        <p className="text-white/50 text-xs">Line {vuln.line_number}</p>
                      )}
                    </div>
                  ))}
                  {analysis.vulnerabilities?.length > 2 && (
                    <p className="text-white/50 text-xs">
                      +{analysis.vulnerabilities.length - 2} more issues...
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}


const AIChat = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [value, setValue] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [conversation, setConversation] = useState<ChatMessage[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [userContext, setUserContext] = useState<any>(null);
  const [isPending, startTransition] = useTransition();
  const [activeSuggestion, setActiveSuggestion] = useState<number>(-1);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [fileAnalyses, setFileAnalyses] = useState<FileAnalysis[]>([]);
  const [recentCommand, setRecentCommand] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { user } = useAuth();
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 60,
    maxHeight: 200,
  });
  const [inputFocused, setInputFocused] = useState(false);
  const commandPaletteRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const commandSuggestions: CommandSuggestion[] = [
    {
      icon: <ImageIcon className="w-4 h-4" />,
      label: "Scan Repository",
      description: "Start a security scan on a repository",
      prefix: "/scan"
    },
    {
      icon: <Figma className="w-4 h-4" />,
      label: "Analyze Vulnerabilities",
      description: "Get detailed vulnerability analysis",
      prefix: "/analyze"
    },
    {
      icon: <FileUp className="w-4 h-4" />,
      label: "Upload Files",
      description: "Upload files for security analysis",
      prefix: "/upload"
    },
    {
      icon: <MonitorIcon className="w-4 h-4" />,
      label: "Security Report",
      description: "Generate a security report",
      prefix: "/report"
    },
    {
      icon: <Sparkles className="w-4 h-4" />,
      label: "Fix Suggestions",
      description: "Get AI-powered fix suggestions",
      prefix: "/fix"
    },
  ];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation, isTyping]);

  // Load user context on component mount
  useEffect(() => {
    const loadUserContext = async () => {
      try {
        const contextData = await aiChatService.getUserContext();
        setUserContext(contextData.context);
      } catch (error) {
        console.error('Failed to load user context:', error);
      }
    };

    if (user) {
      loadUserContext();
    }
  }, [user]);

  useEffect(() => {
    if (value.startsWith('/') && !value.includes(' ')) {
      setShowCommandPalette(true);
      const matchingSuggestionIndex = commandSuggestions.findIndex(
        (cmd) => cmd.prefix.startsWith(value)
      );
      if (matchingSuggestionIndex >= 0) {
        setActiveSuggestion(matchingSuggestionIndex);
      } else {
        setActiveSuggestion(-1);
      }
    } else {
      setShowCommandPalette(false);
    }
  }, [value]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const commandButton = document.querySelector('[data-command-button]');
      if (commandPaletteRef.current &&
        !commandPaletteRef.current.contains(target) &&
        !commandButton?.contains(target)) {
        setShowCommandPalette(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showCommandPalette) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveSuggestion(prev =>
          prev < commandSuggestions.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveSuggestion(prev =>
          prev > 0 ? prev - 1 : commandSuggestions.length - 1
        );
      } else if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        if (activeSuggestion >= 0) {
          const selectedCommand = commandSuggestions[activeSuggestion];
          setValue(selectedCommand.prefix + ' ');
          setShowCommandPalette(false);
          setRecentCommand(selectedCommand.label);
          setTimeout(() => setRecentCommand(null), 3500);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowCommandPalette(false);
      }
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() || attachedFiles.length > 0) {
        handleSendMessage();
      }
    }
  };

  const handleFilesSelected = (files: File[]) => {
    console.log("📁 Files selected:", files);
    
    // Validate files
    const validation = aiChatService.validateFiles(files);
    if (!validation.valid) {
      // Show error messages to user
      validation.errors.forEach(error => {
        console.error("❌ File validation error:", error);
        // You could add a toast notification here
        alert(error);
      });
      return;
    }

    // Add files to attached files
    const newAttachedFiles: AttachedFile[] = files.map(file => ({
      file,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      status: 'pending'
    }));

    setAttachedFiles(prev => [...prev, ...newAttachedFiles]);
    setShowFileUpload(false);
    console.log("✅ Files attached successfully:", newAttachedFiles);
  };

  const removeAttachedFile = (fileId: string) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleSendMessage = async () => {
    if (!value.trim() && attachedFiles.length === 0) return;

    const userMessage = value.trim() || "Please analyze these uploaded files";
    const newUserMessage: ChatMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    };

    // Add user message to conversation
    setConversation(prev => [...prev, newUserMessage]);
    setValue("");
    adjustHeight(true);
    setIsTyping(true);

    try {
      let response: ChatResponse;

      // Check if it's a command
      if (userMessage.startsWith('/')) {
        const command = userMessage.slice(1).split(' ')[0];
        response = await aiChatService.executeCommand(command);
      } else if (attachedFiles.length > 0) {
        // Send message with files
        console.log("🚀 Sending files to AI:", attachedFiles);
        const files = attachedFiles.map(af => af.file);
        response = await aiChatService.sendMessageWithFiles(userMessage, files, conversation);
        
        // Update file analyses
        if (response.file_analyses) {
          setFileAnalyses(response.file_analyses);
          console.log("📊 Received file analyses:", response.file_analyses);
        }
      } else {
        // Regular chat message
        response = await aiChatService.sendMessage(userMessage, conversation);
      }

      // Add AI response to conversation
      const aiMessage: ChatMessage = {
        role: 'assistant',
        content: response.response,
        timestamp: new Date().toISOString()
      };

      setConversation(prev => [...prev, aiMessage]);
      
      // Update suggestions and context
      if (response.suggestions) {
        setSuggestions(response.suggestions);
      }
      if (response.user_context) {
        setUserContext(response.user_context);
      }

      // Clear attached files after successful send
      setAttachedFiles([]);

    } catch (error) {
      console.error('❌ Error sending message:', error);
      
      // Add error message
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: "I'm sorry, I'm experiencing technical difficulties. Please try again in a moment.",
        timestamp: new Date().toISOString()
      };
      setConversation(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestionClick = async (suggestion: string) => {
    setValue(suggestion);
    await handleSendMessage();
  };

  const handleAttachFile = () => {
    console.log("📎 Attach file button clicked");
    setShowFileUpload(true);
  };

  const selectCommandSuggestion = (index: number) => {
    const selectedCommand = commandSuggestions[index];
    setValue(selectedCommand.prefix + ' ');
    setShowCommandPalette(false);
    setRecentCommand(selectedCommand.label);
    setTimeout(() => setRecentCommand(null), 3000);
    
    // Auto-execute the command
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };

  return (
    <div className="w-full h-screen font-sans relative flex overflow-hidden bg-[#0a0a0a]">
      <EtherealBackground 
        color="rgba(255, 255, 255, 0.6)"
        animation={{ scale: 0, speed: 0 }}
        noise={{ opacity: 0.8, scale: 1.2 }}
        sizing="fill"
      />
      
      <AppSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
        {/* Header */}
        <div className="flex-shrink-0 p-4 lg:p-6 border-b border-white/10">
          <div className="max-w-none">
            {/* Breadcrumb Navigation */}
            <div className="flex items-center space-x-2 text-sm">
              <span className="font-medium text-white">User</span>
              <ChevronRight size={16} className="text-gray-300" />
              <span className="font-medium text-white">AI Chat</span>
            </div>
          </div>
        </div>

        {/* Chat Content Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-6">
            <div className="max-w-4xl mx-auto">
              {/* Welcome Message */}
              {conversation.length === 0 && (
                <div className="text-center space-y-6 py-12">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="inline-block"
                  >
                    <h1 className="text-4xl font-medium tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white/90 to-white/40 pb-1">
                      How can I help with security today?
                    </h1>
                    <motion.div
                      className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: "100%", opacity: 1 }}
                      transition={{ delay: 0.5, duration: 0.8 }}
                    />
                  </motion.div>
                  <motion.p
                    className="text-sm text-white/40"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    Ask about vulnerabilities, security scans, upload files, or get recommendations
                  </motion.p>

                  {/* Quick Action Buttons */}
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-8">
                    {commandSuggestions.map((suggestion, index) => (
                      <motion.button
                        key={suggestion.prefix}
                        onClick={() => selectCommandSuggestion(index)}
                        className="flex items-center gap-2 px-4 py-3 bg-white/[0.02] hover:bg-white/[0.08] rounded-lg text-sm text-white/60 hover:text-white/90 transition-all relative group border border-white/[0.05] hover:border-white/[0.15]"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {suggestion.icon}
                        <span>{suggestion.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat Messages */}
              <AnimatePresence>
                {conversation.length > 0 && (
                  <motion.div
                    className="space-y-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {conversation.map((message, index) => (
                      <motion.div
                        key={index}
                        className={cn(
                          "flex",
                          message.role === 'user' ? "justify-end" : "justify-start"
                        )}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div
                          className={cn(
                            "max-w-[85%] rounded-2xl px-6 py-4 text-sm leading-relaxed",
                            message.role === 'user'
                              ? "bg-white/10 text-white ml-auto backdrop-blur-sm border border-white/10"
                              : "bg-white/5 text-white/90 border border-white/10 backdrop-blur-sm"
                          )}
                        >
                          <div className="whitespace-pre-wrap">{message.content}</div>
                        </div>
                      </motion.div>
                    ))}
                    
                    {/* Show file analysis results if available */}
                    {fileAnalyses.length > 0 && (
                      <motion.div
                        className="flex justify-start"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <div className="max-w-[85%] rounded-2xl px-6 py-4 bg-white/5 border border-white/10 backdrop-blur-sm">
                          <FileAnalysisResults analyses={fileAnalyses} />
                        </div>
                      </motion.div>
                    )}

                    {/* Typing Indicator */}
                    {isTyping && (
                      <motion.div
                        className="flex justify-start"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/[0.05] flex items-center justify-center">
                              <span className="text-xs font-medium text-white/90">AI</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-white/70">
                              <span>Analyzing</span>
                              <TypingDots />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* AI Suggestions */}
              <AnimatePresence>
                {suggestions.length > 0 && conversation.length > 0 && (
                  <motion.div
                    className="flex flex-wrap items-center justify-center gap-2 pt-6"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <div className="text-xs text-white/40 mb-2 w-full text-center">
                      Suggested follow-ups:
                    </div>
                    {suggestions.map((suggestion, index) => (
                      <motion.button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="px-3 py-1.5 bg-white/[0.02] hover:bg-white/[0.05] rounded-lg text-xs text-white/60 hover:text-white/90 transition-all border border-white/[0.05]"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        {suggestion}
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="flex-shrink-0 p-4 lg:p-6 border-t border-white/10">
            <div className="max-w-4xl mx-auto">
              {/* File Upload Modal */}
              <AnimatePresence>
                {showFileUpload && (
                  <motion.div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowFileUpload(false)}
                  >
                    <motion.div
                      className="bg-black/90 backdrop-blur-xl rounded-2xl p-6 max-w-md w-full mx-4 border border-white/10"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-medium">Upload Code Files</h3>
                        <button
                          onClick={() => setShowFileUpload(false)}
                          className="text-white/40 hover:text-white"
                        >
                          <XIcon className="w-5 h-5" />
                        </button>
                      </div>
                      
                      <FileUploadArea onFilesSelected={handleFilesSelected} />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                className="relative backdrop-blur-2xl bg-white/[0.02] rounded-2xl border border-white/[0.05] shadow-2xl"
                initial={{ scale: 0.98 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1 }}
              >
                <AnimatePresence>
                  {showCommandPalette && (
                    <motion.div
                      ref={commandPaletteRef}
                      className="absolute left-4 right-4 bottom-full mb-2 backdrop-blur-xl bg-black/90 rounded-lg z-50 shadow-lg border border-white/10 overflow-hidden"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      transition={{ duration: 0.15 }}
                    >
                      <div className="py-1 bg-black/95">
                        {commandSuggestions.map((suggestion, index) => (
                          <motion.div
                            key={suggestion.prefix}
                            className={cn(
                              "flex items-center gap-2 px-3 py-2 text-xs transition-colors cursor-pointer",
                              activeSuggestion === index
                                ? "bg-white/10 text-white"
                                : "text-white/70 hover:bg-white/5"
                            )}
                            onClick={() => selectCommandSuggestion(index)}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.03 }}
                          >
                            <div className="w-5 h-5 flex items-center justify-center text-white/60">
                              {suggestion.icon}
                            </div>
                            <div className="font-medium">{suggestion.label}</div>
                            <div className="text-white/40 text-xs ml-1">
                              {suggestion.prefix}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="p-4">
                  <Textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => {
                      setValue(e.target.value);
                      adjustHeight();
                    }}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => setInputFocused(false)}
                    placeholder="Ask SecureThread AI a question or upload files for analysis..."
                    containerClassName="w-full"
                    className={cn(
                      "w-full px-4 py-3",
                      "resize-none",
                      "bg-transparent",
                      "border-none",
                      "text-white/90 text-sm",
                      "focus:outline-none",
                      "placeholder:text-white/20",
                      "min-h-[60px]"
                    )}
                    style={{
                      overflow: "hidden",
                    }}
                    showRing={false}
                  />
                </div>

                {/* Attached Files Display */}
                <AnimatePresence>
                  {attachedFiles.length > 0 && (
                    <motion.div
                      className="px-4 pb-3 flex gap-2 flex-wrap"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      {attachedFiles.map((attachedFile) => (
                        <motion.div
                          key={attachedFile.id}
                          className="flex items-center gap-2 text-xs bg-white/[0.03] py-1.5 px-3 rounded-lg text-white/70 border border-white/10"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                        >
                          <FileText className="w-3 h-3" />
                          <span className="truncate max-w-32">{attachedFile.file.name}</span>
                          <span className="text-white/40">
                            ({(attachedFile.file.size / 1024).toFixed(1)}KB)
                          </span>
                          <button
                            onClick={() => removeAttachedFile(attachedFile.id)}
                            className="text-white/40 hover:text-white transition-colors"
                          >
                            <XIcon className="w-3 h-3" />
                          </button>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="p-4 border-t border-white/[0.05] flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <motion.button
                      type="button"
                      onClick={handleAttachFile}
                      whileTap={{ scale: 0.94 }}
                      className="p-2 text-white/40 hover:text-white/90 rounded-lg transition-colors relative group"
                    >
                      <Paperclip className="w-4 h-4" />
                      <motion.span
                        className="absolute inset-0 bg-white/[0.05] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        layoutId="button-highlight"
                      />
                    </motion.button>
                    <motion.button
                      type="button"
                      data-command-button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowCommandPalette(prev => !prev);
                      }}
                      whileTap={{ scale: 0.94 }}
                      className={cn(
                        "p-2 text-white/40 hover:text-white/90 rounded-lg transition-colors relative group",
                        showCommandPalette && "bg-white/10 text-white/90"
                      )}
                    >
                      <Command className="w-4 h-4" />
                      <motion.span
                        className="absolute inset-0 bg-white/[0.05] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        layoutId="button-highlight"
                      />
                    </motion.button>
                  </div>
                  <motion.button
                    type="button"
                    onClick={handleSendMessage}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isTyping || (!value.trim() && attachedFiles.length === 0)}
                    className={cn(
                      "px-6 py-2 rounded-lg text-sm font-medium transition-all",
                      "flex items-center gap-2",
                      (value.trim() || attachedFiles.length > 0)
                        ? "bg-white text-[#0A0A0B] shadow-lg shadow-white/10 hover:bg-white/90"
                        : "bg-white/[0.05] text-white/40"
                    )}
                  >
                    {isTyping ? (
                      <LoaderIcon className="w-4 h-4 animate-[spin_2s_linear_infinite]" />
                    ) : (
                      <SendIcon className="w-4 h-4" />
                    )}
                    <span>Send</span>
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChat;