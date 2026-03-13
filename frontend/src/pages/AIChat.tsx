import React, { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Sparkles, Loader2 } from "lucide-react";
import AppSidebar from "@/components/AppSidebar";
import { ThemeBackground } from "@/components/ui/theme-background";
import { useTheme } from "@/contexts/ThemeContext";
import  { aiChatService, ChatMessage } from "@/services/aiChatService";
import { AIChatSkeleton } from '@/components/skeletons/AIChatSkeleton';

const AIChat = () => {
  const { actualTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = React.useState(true); 
  const scrollToBottom = () => {
    messagesEndRef.current?. scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React. FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim() || isStreaming) return;

    const userMessage:  ChatMessage = {
      role: "user",
      content:  inputValue,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsStreaming(true);
    setCurrentStreamingMessage("");

    try {
      let fullResponse = "";
      
      await aiChatService.sendMessageStream(
        userMessage.content,
        messages,
        // onChunk - called for each word
        (chunk:  string) => {
          fullResponse += chunk;
          setCurrentStreamingMessage(fullResponse);
        },
        // onComplete - called when done
        (sessionId: number, messageId: number) => {
          const aiMessage: ChatMessage = {
            role: "assistant",
            content: fullResponse,
            timestamp: new Date().toISOString(),
          };
          
          setMessages((prev) => [...prev, aiMessage]);
          setCurrentStreamingMessage("");
          setIsStreaming(false);
        },
        // onError
        (error: string) => {
          console.error("Streaming error:", error);
          const errorMessage: ChatMessage = {
            role: "assistant",
            content: "Sorry, I encountered an error:  " + error,
            timestamp:  new Date().toISOString(),
          };
          setMessages((prev) => [...prev, errorMessage]);
          setCurrentStreamingMessage("");
          setIsStreaming(false);
        }
      );
    } catch (error) {
      console.error("Error sending message:", error);
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

      <div className="flex-1 overflow-y-auto overflow-x-hidden relative z-10">
        <div className="min-h-screen flex flex-col relative">
          {/* Header */}
          <header className="flex justify-between items-center p-6 relative z-20">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#003D6B] dark:bg-orange-500 rounded-lg flex items-center justify-center shadow-md">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="font-bold text-lg text-gray-900 dark:text-white">SecureThread AI</div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 px-4 pb-32 relative z-10">
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
                <div className="space-y-6 pt-6">
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-6 py-4 shadow-md ${
                          msg.role === "user"
                            ? "bg-[#003D6B] dark:bg-orange-500 text-white"
                            : "bg-white dark:bg-white/10 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-white/20"
                        }`}
                      >
                        <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                      </div>
                    </div>
                  ))}

                  {/* Streaming Message */}
                  {isStreaming && currentStreamingMessage && (
                    <div className="flex justify-start">
                      <div className="max-w-[80%] rounded-2xl px-6 py-4 bg-white dark:bg-white/10 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-white/20 shadow-md">
                        <div className="whitespace-pre-wrap break-words">{currentStreamingMessage}</div>
                        <span className="inline-block w-2 h-5 bg-current animate-pulse ml-1" />
                      </div>
                    </div>
                  )}

                  {/* Loading Indicator */}
                  {isStreaming && ! currentStreamingMessage && (
                    <div className="flex justify-start">
                      <div className="rounded-2xl px-6 py-4 bg-white dark: bg-white/10 border-2 border-gray-200 dark:border-white/20 shadow-md">
                        <Loader2 className="w-5 h-5 animate-spin text-[#003D6B] dark: text-orange-500" />
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </main>

          {/* Input Area - Fixed at Bottom */}
          <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white dark:from-[#0a0a0a] via-white/95 dark:via-[#0a0a0a]/95 to-transparent backdrop-blur-sm z-30" style={{ marginLeft: sidebarOpen ? '256px' : '0', transition: 'margin-left 0.3s' }}>
            <form onSubmit={handleSubmit} className="relative max-w-3xl mx-auto w-full">
              <div className="bg-white dark:bg-white/5 border-2 border-gray-300 dark:border-white/10 rounded-2xl p-2 flex items-center gap-2 shadow-2xl backdrop-blur-md transition-all duration-300 hover:shadow-3xl focus-within:border-[#003D6B] dark: focus-within:border-orange-500/50">
                
                {/* Attachment Button */}
                <button 
                  type="button"
                  className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-all duration-200 group flex-shrink-0"
                  aria-label="Attach file"
                  disabled={isStreaming}
                >
                  <Paperclip className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-[#003D6B] dark: group-hover:text-orange-500 transition-colors" />
                </button>

                {/* AI Sparkles Button */}
                <button 
                  type="button"
                  className="p-2.5 rounded-xl hover:bg-[#D6E6FF] dark:hover:bg-orange-500/10 transition-all duration-200 group flex-shrink-0"
                  aria-label="AI suggestions"
                  disabled={isStreaming}
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
                  className="chat-input-reset flex-1 bg-transparent border-none outline-none focus:ring-0 focus:outline-none text-gray-900 dark:text-white px-2 py-2.5 text-base placeholder: text-gray-500 dark:placeholder:text-gray-400 appearance-none disabled:opacity-50"
                />

                {/* Send Button */}
                <button 
                  type="submit"
                  disabled={! inputValue.trim() || isStreaming}
                  className={`p-2.5 rounded-xl transition-all duration-200 flex-shrink-0 ${
                    inputValue.trim() && !isStreaming
                      ?  'bg-[#003D6B] hover:bg-[#002A4D] dark:bg-orange-500 dark:hover:bg-orange-600 shadow-md hover:shadow-lg' 
                      : 'bg-gray-200 dark:bg-white/10 cursor-not-allowed'
                  }`}
                  aria-label="Send message"
                >
                  {isStreaming ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <Send className={`w-5 h-5 ${
                      inputValue.trim() 
                        ? 'text-white' 
                        : 'text-gray-400 dark:text-gray-500'
                    }`} />
                  )}
                </button>
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
        </div>
      </div>
      )}
    </div>
  );
};

export default AIChat;