"use client";

import * as React from "react";
import { Paperclip, Sparkles, Send } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import AppSidebar from "../components/AppSidebar";
import { ThemeBackground } from "../components/ui/theme-background";

const AIChat = () => {
  const { actualTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      console.log("Sending message:", inputValue);
      // Handle message send here
      setInputValue("");
    }
  };

  return (
    <div className="w-full h-screen font-sans relative flex overflow-hidden">
      {/* Theme-aware Background */}
      <ThemeBackground />

      <AppSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 overflow-y-auto overflow-x-hidden relative z-10">
        <div className="min-h-screen flex flex-col relative">
          {/* Header */}
          <header className="flex justify-between items-center p-6 relative z-20">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center shadow-md">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="font-bold text-lg text-gray-900 dark:text-white">SecureThread AI</div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 flex flex-col items-center justify-center px-4 text-center relative z-10 pb-20">
            <div className="max-w-4xl mx-auto space-y-8 w-full">
              {/* Badge */}
              <div className="flex justify-center">
                <div className="bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 rounded-full px-5 py-2.5 flex items-center gap-2 shadow-lg backdrop-blur-sm">
                  <span className="text-sm flex items-center gap-2 text-gray-800 dark:text-white font-medium">
                    <span className="bg-orange-500 p-1.5 rounded-full text-white">🎉</span>
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

              {/* Chat Input Box */}
              <form onSubmit={handleSubmit} className="relative max-w-3xl mx-auto w-full mt-8">
                <div className="bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 rounded-2xl p-2 flex items-center gap-2 shadow-2xl backdrop-blur-sm transition-all duration-300 hover:shadow-3xl focus-within:border-orange-500 dark:focus-within:border-orange-500">
                  {/* Attachment Button */}
                  <button 
                    type="button"
                    className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 group"
                    aria-label="Attach file"
                  >
                    <Paperclip className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-orange-500 transition-colors" />
                  </button>

                  {/* AI Sparkles Button */}
                  <button 
                    type="button"
                    className="p-2.5 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-all duration-200 group"
                    aria-label="AI suggestions"
                  >
                    <Sparkles className="w-5 h-5 text-orange-500 group-hover:scale-110 transition-transform" />
                  </button>

                  {/* Input Field */}
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="How can SecureThread AI help you today?"
                    className="bg-transparent flex-1 outline-none text-gray-900 dark:text-gray-100 px-2 py-2 text-base placeholder:text-gray-500 dark:placeholder:text-gray-400"
                  />

                  {/* Send Button */}
                  <button 
                    type="submit"
                    disabled={!inputValue.trim()}
                    className={`p-2.5 rounded-xl transition-all duration-200 ${
                      inputValue.trim() 
                        ? 'bg-orange-500 hover:bg-orange-600 shadow-md hover:shadow-lg' 
                        : 'bg-gray-200 dark:bg-gray-700 cursor-not-allowed'
                    }`}
                    aria-label="Send message"
                  >
                    <Send className={`w-5 h-5 ${
                      inputValue.trim() 
                        ? 'text-white' 
                        : 'text-gray-400 dark:text-gray-500'
                    }`} />
                  </button>
                </div>

                {/* Character count or helper text */}
                <div className="flex justify-between items-center mt-2 px-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Press Enter to send, Shift+Enter for new line
                  </p>
                  {inputValue.length > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {inputValue.length} characters
                    </p>
                  )}
                </div>
              </form>

              {/* Suggestion pills */}
              <div className="flex flex-wrap justify-center gap-3 mt-12 max-w-3xl mx-auto">
                <button 
                  onClick={() => setInputValue("Analyze security vulnerabilities in my repository")}
                  className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-2 border-gray-300 dark:border-gray-700 rounded-xl px-5 py-3 text-sm text-gray-800 dark:text-white font-medium shadow-md hover:shadow-lg transition-all hover:scale-105 backdrop-blur-sm"
                >
                  Analyze security vulnerabilities
                </button>
                <button 
                  onClick={() => setInputValue("Review code quality metrics for my project")}
                  className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-2 border-gray-300 dark:border-gray-700 rounded-xl px-5 py-3 text-sm text-gray-800 dark:text-white font-medium shadow-md hover:shadow-lg transition-all hover:scale-105 backdrop-blur-sm"
                >
                  Review code quality metrics
                </button>
                <button 
                  onClick={() => setInputValue("Generate a comprehensive security report")}
                  className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-2 border-gray-300 dark:border-gray-700 rounded-xl px-5 py-3 text-sm text-gray-800 dark:text-white font-medium shadow-md hover:shadow-lg transition-all hover:scale-105 backdrop-blur-sm"
                >
                  Generate security reports
                </button>
                <button 
                  onClick={() => setInputValue("Scan for OWASP Top 10 vulnerabilities")}
                  className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-2 border-gray-300 dark:border-gray-700 rounded-xl px-5 py-3 text-sm text-gray-800 dark:text-white font-medium shadow-md hover:shadow-lg transition-all hover:scale-105 backdrop-blur-sm"
                >
                  Scan for OWASP Top 10
                </button>
                <button 
                  onClick={() => setInputValue("Check my project's compliance status")}
                  className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-2 border-gray-300 dark:border-gray-700 rounded-xl px-5 py-3 text-sm text-gray-800 dark:text-white font-medium shadow-md hover:shadow-lg transition-all hover:scale-105 backdrop-blur-sm"
                >
                  Check compliance status
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AIChat;