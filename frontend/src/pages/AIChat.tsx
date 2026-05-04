import React, { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Sparkles, Loader2, StopCircle, Clock, MessageSquare, ChevronRight, Brain, Shield, Zap } from "lucide-react";
import AppSidebar from "@/components/AppSidebar";
import { ThemeBackground } from "@/components/ui/theme-background";
import { useTheme } from "@/contexts/ThemeContext";
import  { aiChatService, ChatMessage } from "@/services/aiChatService";
import { AIChatSkeleton } from '@/components/skeletons/AIChatSkeleton';
import { MarkdownRenderer } from "@/components/AIChat/MarkdownRenderer";

const AIChat = () => {
  const { actualTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = React.useState(true); 
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentSuggestions, setCurrentSuggestions] = useState<string[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const estimatedTokens = Math.min(Math.round(JSON.stringify(messages).length / 4), 30000);
  const tokenPercentage = (estimatedTokens / 30000) * 100;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    const fetchSessions = async () => {
      try {
        const data = await aiChatService.getChatSessions();
        setSessions(data);
      } catch (e) {
        console.error("Failed to fetch sessions", e);
      }
    };
    fetchSessions();

    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const loadSession = async (sessionId: number) => {
    try {
      setLoading(true);
      const sessionMessages = await aiChatService.getSessionMessages(sessionId);
      setMessages(sessionMessages);
      setActiveSessionId(sessionId);
      setHistoryOpen(false);
    } catch (e) {
      console.error("Failed to load session messages", e);
    } finally {
      setLoading(false);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setActiveSessionId(null);
    setCurrentStreamingMessage("");
    setIsStreaming(false);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  const stopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
      
      if (currentStreamingMessage) {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: currentStreamingMessage + "\n\n*[Stopped by user]*",
          timestamp: new Date().toISOString()
        }]);
        setCurrentStreamingMessage("");
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentStreamingMessage]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      const validation = aiChatService.validateFiles(filesArray);
      if (validation.valid) {
        setSelectedFiles(prev => [...prev, ...filesArray]);
      } else {
        alert("Invalid files: \n" + validation.errors.join("\n"));
      }
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleEnhancePrompt = () => {
    if (!inputValue.trim()) return;
    setInputValue(prev => `Please provide a detailed, step-by-step security analysis regarding the following topic. Include specific examples, potential vulnerabilities, and recommended best practices: \n\n${prev}`);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if ((!inputValue.trim() && selectedFiles.length === 0) || isStreaming) return;

    const userMessageContent = inputValue.trim() || "Please analyze the attached files.";
    
    const userMessage: ChatMessage = {
      role: "user",
      content: userMessageContent + (selectedFiles.length > 0 ? `\n\n[Attached ${selectedFiles.length} file(s)]` : ""),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setCurrentSuggestions([]);
    setIsStreaming(true);
    setCurrentStreamingMessage("");

    try {
      abortControllerRef.current = new AbortController();

      if (selectedFiles.length > 0) {
        // Send with files (non-streaming)
        const filesToSend = [...selectedFiles];
        setSelectedFiles([]);
        
        const response = await aiChatService.sendMessageWithFiles(
          userMessageContent,
          filesToSend,
          messages
        );
        
        const aiMessage: ChatMessage = {
          role: "assistant",
          content: response.response,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiMessage]);
        if (response.suggestions) {
          setCurrentSuggestions(response.suggestions);
        }
        setIsStreaming(false);
      } else {
        // Streaming chat
        let fullResponse = "";
        await aiChatService.sendMessageStream(
          userMessageContent,
          messages,
          (chunk) => {
            fullResponse += chunk;
            setCurrentStreamingMessage(fullResponse);
          },
          (sessionId, messageId) => {
            const aiMessage: ChatMessage = {
              role: "assistant",
              content: fullResponse,
              timestamp: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, aiMessage]);
            setCurrentStreamingMessage("");
            setIsStreaming(false);
            if (!activeSessionId) setActiveSessionId(sessionId);
          },
          (error) => {
            if (error === "Request was aborted") return;
            console.error("Streaming error:", error);
            const errorMessage: ChatMessage = {
              role: "assistant",
              content: "Sorry, I encountered an error: " + error,
              timestamp: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, errorMessage]);
            setIsStreaming(false);
            setCurrentStreamingMessage("");
          },
          abortControllerRef.current.signal
        );
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: "Sorry, I encountered an error: " + (error instanceof Error ? error.message : "Unknown error"),
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setIsStreaming(false);
      setCurrentStreamingMessage("");
    }
  };

  return (
    <div className="w-full h-screen font-sans relative flex overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: `
        .dark input. chat-input-reset {
          background-color: transparent !important;
          background-image: none !important;
          border: none !important;
          box-shadow: none !important;
        }
        .dark input.chat-input-reset:focus,
        .dark input.chat-input-reset:not(:focus) {
          background-color: transparent !important;
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
        }
      `}} />

      <ThemeBackground />

      <AppSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      {loading ? (
        <AIChatSkeleton />
      ) : (

      <div className="flex-1 overflow-y-auto overflow-x-hidden relative z-10 flex flex-col transition-all duration-300" style={{ marginRight: historyOpen ? '320px' : '0' }}>
        <div className="min-h-screen flex flex-col relative">
          {/* Header */}
          <header className="flex justify-between items-center p-6 relative z-20 sticky top-0 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md border-b border-gray-200 dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#003D6B] to-[#005B9F] dark:from-orange-500 dark:to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-[#003D6B]/20 dark:shadow-orange-500/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-xl text-gray-900 dark:text-white leading-tight">SecureThread AI</h1>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-[#003D6B] dark:text-orange-400 bg-[#D6E6FF]/50 dark:bg-orange-500/10 px-2 py-0.5 rounded-full border border-[#003D6B]/10 dark:border-orange-500/20">
                    <Brain className="w-3.5 h-3.5" />
                    DeepSeek Powered
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Token Memory Indicator */}
              {messages.length > 0 && (
                <div className="hidden md:flex flex-col items-end mr-4">
                  <div className="flex items-center gap-1.5 mb-1 text-xs text-gray-500 dark:text-gray-400">
                    <Brain className="w-3.5 h-3.5" />
                    <span>Memory Usage</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300 ml-1">{Math.round(tokenPercentage)}%</span>
                  </div>
                  <div className="w-32 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${tokenPercentage > 80 ? 'bg-red-500' : tokenPercentage > 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                      style={{ width: `${Math.min(tokenPercentage, 100)}%` }}
                    />
                  </div>
                </div>
              )}
              
              <button 
                onClick={startNewChat}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 transition-all shadow-sm"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="hidden sm:inline">New Chat</span>
              </button>
              
              <button 
                onClick={() => setHistoryOpen(!historyOpen)}
                className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-all shadow-sm ${
                  historyOpen 
                    ? 'bg-[#003D6B] border-[#003D6B] text-white dark:bg-orange-500 dark:border-orange-500' 
                    : 'bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span className="hidden sm:inline">History</span>
              </button>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 px-4 md:px-8 pb-40 relative z-10">
            <div className="max-w-4xl mx-auto">
              {messages.length === 0 ? (
                // Welcome Screen (shown when no messages)
                <div className="flex flex-col items-center justify-center text-center space-y-8" style={{ minHeight: 'calc(100vh - 300px)' }}>
                  {/* Badge */}
                  <div className="flex justify-center">
                    <div className="bg-white dark:bg-white/10 border-2 border-gray-300 dark:border-white/20 rounded-full px-6 py-2. 5 flex items-center gap-2.5 shadow-lg backdrop-blur-sm">
                      <span className="text-sm flex items-center gap-2. 5 text-gray-800 dark:text-white font-medium whitespace-nowrap">
                        <span className="bg-[#003D6B] dark:bg-orange-500 p-1. 5 rounded-full text-white flex items-center justify-center">🎉</span>
                        Introducing Security AI Assistant
                      </span>
                    </div>
                  </div>

                  {/* Headline */}
                  <h1 className="text-5xl md:text-6xl font-bold leading-tight text-gray-900 dark:text-white">
                    Secure Your Code with AI Intelligence
                  </h1>

                  {/* Subtitle */}
                  <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                    SecureThread AI can analyze vulnerabilities and provide instant security insights with simple prompts.
                  </p>

                  {/* Suggestion pills */}
                  <div className="flex flex-wrap justify-center gap-3 mt-8 max-w-3xl mx-auto">
                    <button 
                      onClick={() => setInputValue("Analyze security vulnerabilities in my repository")}
                      className="bg-white dark:bg-gray-800 hover:bg-[#D6E6FF] dark:hover:bg-gray-700 border-2 border-gray-300 dark:border-gray-700 rounded-xl px-5 py-3 text-sm text-gray-800 dark: text-white font-medium shadow-md hover:shadow-lg transition-all hover:scale-105 backdrop-blur-sm"
                    >
                      Analyze security vulnerabilities
                    </button>
                    <button 
                      onClick={() => setInputValue("Review code quality metrics for my project")}
                      className="bg-white dark:bg-gray-800 hover:bg-[#D6E6FF] dark:hover:bg-gray-700 border-2 border-gray-300 dark:border-gray-700 rounded-xl px-5 py-3 text-sm text-gray-800 dark:text-white font-medium shadow-md hover:shadow-lg transition-all hover:scale-105 backdrop-blur-sm"
                    >
                      Review code quality metrics
                    </button>
                    <button 
                      onClick={() => setInputValue("Generate a comprehensive security report")}
                      className="bg-white dark: bg-gray-800 hover: bg-[#D6E6FF] dark:hover:bg-gray-700 border-2 border-gray-300 dark: border-gray-700 rounded-xl px-5 py-3 text-sm text-gray-800 dark:text-white font-medium shadow-md hover:shadow-lg transition-all hover:scale-105 backdrop-blur-sm"
                    >
                      Generate security reports
                    </button>
                    <button 
                      onClick={() => setInputValue("Scan for OWASP Top 10 vulnerabilities")}
                      className="bg-white dark:bg-gray-800 hover:bg-[#D6E6FF] dark:hover:bg-gray-700 border-2 border-gray-300 dark:border-gray-700 rounded-xl px-5 py-3 text-sm text-gray-800 dark:text-white font-medium shadow-md hover: shadow-lg transition-all hover: scale-105 backdrop-blur-sm"
                    >
                      Scan for OWASP Top 10
                    </button>
                    <button 
                      onClick={() => setInputValue("Check my project's compliance status")}
                      className="bg-white dark:bg-gray-800 hover:bg-[#D6E6FF] dark:hover:bg-gray-700 border-2 border-gray-300 dark:border-gray-700 rounded-xl px-5 py-3 text-sm text-gray-800 dark:text-white font-medium shadow-md hover: shadow-lg transition-all hover: scale-105 backdrop-blur-sm"
                    >
                      Check compliance status
                    </button>
                  </div>
                </div>
              ) : (
                // Chat Messages (shown when conversation starts)
                <div className="space-y-8 pt-6">
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`flex gap-4 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-sm ${
                          msg.role === "user" 
                            ? "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300" 
                            : "bg-gradient-to-br from-[#003D6B] to-[#005B9F] dark:from-orange-500 dark:to-orange-600 text-white"
                        }`}>
                          {msg.role === "user" ? <div className="w-4 h-4 rounded-full bg-current" /> : <Shield className="w-4 h-4" />}
                        </div>
                        
                        <div
                          className={`rounded-2xl px-6 py-4 shadow-md ${
                            msg.role === "user"
                              ? "bg-[#003D6B] dark:bg-orange-500 text-white rounded-tr-sm"
                              : "bg-white/90 dark:bg-[#1a1a1a]/90 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 rounded-tl-sm backdrop-blur-sm"
                          }`}
                        >
                          {msg.role === "user" ? (
                            <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                          ) : (
                            <MarkdownRenderer content={msg.content} />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Streaming Message */}
                  {isStreaming && currentStreamingMessage && (
                    <div className="flex justify-start">
                      <div className="flex gap-4 max-w-[85%]">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-sm bg-gradient-to-br from-[#003D6B] to-[#005B9F] dark:from-orange-500 dark:to-orange-600 text-white">
                          <Shield className="w-4 h-4" />
                        </div>
                        <div className="rounded-2xl px-6 py-4 bg-white/90 dark:bg-[#1a1a1a]/90 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 rounded-tl-sm backdrop-blur-sm shadow-md">
                          <MarkdownRenderer content={currentStreamingMessage + " ▊"} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Loading Indicator */}
                  {isStreaming && !currentStreamingMessage && (
                    <div className="flex justify-start">
                      <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-sm bg-gradient-to-br from-[#003D6B] to-[#005B9F] dark:from-orange-500 dark:to-orange-600 text-white">
                          <Shield className="w-4 h-4" />
                        </div>
                        <div className="rounded-2xl px-6 py-4 bg-white/90 dark:bg-[#1a1a1a]/90 border border-gray-200 dark:border-gray-800 rounded-tl-sm backdrop-blur-sm shadow-md">
                          <div className="flex gap-1.5 items-center h-6">
                            <span className="w-2 h-2 rounded-full bg-[#003D6B] dark:bg-orange-500 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-2 h-2 rounded-full bg-[#003D6B] dark:bg-orange-500 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-2 h-2 rounded-full bg-[#003D6B] dark:bg-orange-500 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Dynamic Suggestions from AI */}
                  {!isStreaming && currentSuggestions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4 ml-2 max-w-[80%]">
                      {currentSuggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setInputValue(suggestion);
                            // We use a timeout to let the state update before submission
                            setTimeout(() => {
                              const form = document.getElementById("chat-form");
                              if (form) form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
                            }, 50);
                          }}
                          className="bg-white/50 dark:bg-gray-800/50 hover:bg-[#D6E6FF] dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-sm text-gray-700 dark:text-gray-200 shadow-sm transition-all text-left"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </main>

          {/* Input Area - Fixed at Bottom */}
          <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white dark:from-[#0a0a0a] via-white/95 dark:via-[#0a0a0a]/95 to-transparent backdrop-blur-sm z-30" style={{ marginLeft: sidebarOpen ? '256px' : '0', transition: 'margin-left 0.3s' }}>
            
            {/* Selected Files Display */}
            {selectedFiles.length > 0 && (
              <div className="max-w-3xl mx-auto w-full flex flex-wrap gap-2 mb-3">
                {selectedFiles.map((file, idx) => (
                  <div key={idx} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 flex items-center gap-2 shadow-sm">
                    <Paperclip className="w-4 h-4 text-gray-500" />
                    <span className="text-xs text-gray-700 dark:text-gray-300 max-w-[150px] truncate">{file.name}</span>
                    <button 
                      type="button" 
                      onClick={() => removeFile(idx)}
                      className="text-gray-400 hover:text-red-500 ml-1"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <form id="chat-form" onSubmit={handleSubmit} className="relative max-w-3xl mx-auto w-full">
              <div className="bg-white dark:bg-white/5 border-2 border-gray-300 dark:border-white/10 rounded-2xl p-2 flex items-center gap-2 shadow-2xl backdrop-blur-md transition-all duration-300 hover:shadow-3xl focus-within:border-[#003D6B] dark:focus-within:border-orange-500/50">
                
                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  multiple
                />

                {/* Attachment Button */}
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-all duration-200 group flex-shrink-0"
                  aria-label="Attach file"
                  disabled={isStreaming}
                >
                  <Paperclip className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-[#003D6B] dark:group-hover:text-orange-500 transition-colors" />
                </button>

                {/* AI Sparkles Button */}
                <button 
                  type="button"
                  onClick={handleEnhancePrompt}
                  className="p-2.5 rounded-xl hover:bg-[#D6E6FF] dark:hover:bg-orange-500/10 transition-all duration-200 group flex-shrink-0"
                  aria-label="AI suggestions"
                  disabled={isStreaming || !inputValue.trim()}
                >
                  <Sparkles className="w-5 h-5 text-[#003D6B] dark:text-orange-500 group-hover:scale-110 transition-transform" />
                </button>

                {/* Input Field */}
                <input
                  type="text"
                  autoComplete="off"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="How can SecureThread AI help you today?"
                  disabled={isStreaming}
                  className="chat-input-reset flex-1 bg-transparent border-none outline-none focus:ring-0 focus:outline-none text-gray-900 dark:text-white px-2 py-2.5 text-base placeholder:text-gray-500 dark:placeholder:text-gray-400 appearance-none disabled:opacity-50"
                />

                {/* Send / Stop Button */}
                {isStreaming ? (
                  <button 
                    type="button"
                    onClick={stopGenerating}
                    className="p-2.5 rounded-xl transition-all duration-200 flex-shrink-0 bg-red-500 hover:bg-red-600 text-white shadow-md hover:shadow-lg flex items-center gap-1.5"
                    aria-label="Stop generating"
                  >
                    <StopCircle className="w-5 h-5" />
                    <span className="hidden sm:inline text-sm font-medium pr-1">Stop</span>
                  </button>
                ) : (
                  <button 
                    type="submit"
                    disabled={!inputValue.trim() && selectedFiles.length === 0}
                    className={`p-2.5 rounded-xl transition-all duration-200 flex-shrink-0 ${
                      inputValue.trim() || selectedFiles.length > 0
                        ? 'bg-[#003D6B] hover:bg-[#002A4D] dark:bg-orange-500 dark:hover:bg-orange-600 shadow-md hover:shadow-lg' 
                        : 'bg-gray-200 dark:bg-white/10 cursor-not-allowed'
                    }`}
                    aria-label="Send message"
                  >
                    <Send className={`w-5 h-5 ${
                      inputValue.trim() || selectedFiles.length > 0
                        ? 'text-white' 
                        : 'text-gray-400 dark:text-gray-500'
                    }`} />
                  </button>
                )}
              </div>

              {/* Helper text */}
              <div className="flex justify-between items-center mt-2 px-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Press Enter to send
                </p>
                {inputValue.length > 0 && (
                  <p className="text-xs text-gray-500 dark: text-gray-400">
                    {inputValue.length} characters
                  </p>
                )}
              </div>
            </form>
          </div>
          
          {/* History Sidebar */}
          <div 
            className={`fixed top-0 right-0 h-full w-80 bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-xl border-l border-gray-200 dark:border-white/10 shadow-2xl transition-transform duration-300 z-50 flex flex-col ${historyOpen ? 'translate-x-0' : 'translate-x-full'}`}
          >
            <div className="p-6 border-b border-gray-200 dark:border-white/10 flex justify-between items-center">
              <h2 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#003D6B] dark:text-orange-500" />
                Chat History
              </h2>
              <button onClick={() => setHistoryOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors">
                <ChevronRight className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {sessions.length === 0 ? (
                <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                  <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-50" />
                  <p>No chat history found</p>
                </div>
              ) : (
                sessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => loadSession(session.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      activeSessionId === session.id 
                        ? 'bg-[#D6E6FF]/50 border-[#003D6B]/30 dark:bg-orange-500/10 dark:border-orange-500/30 shadow-sm' 
                        : 'bg-white dark:bg-white/5 border-gray-100 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/20'
                    }`}
                  >
                    <div className="font-medium text-gray-900 dark:text-white truncate pr-2">
                      {session.title || "New Conversation"}
                    </div>
                    <div className="flex justify-between items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>{new Date(session.created_at).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {session.message_count}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
          
          {/* Overlay for mobile history */}
          {historyOpen && (
            <div 
              className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setHistoryOpen(false)}
            />
          )}

        </div>
      </div>
      )}
    </div>
  );
};

export default AIChat;