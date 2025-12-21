// frontend/src/services/aiChatService.ts - Updated to support file uploads

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface FileAnalysis {
  file_name: string;
  file_size: number;
  vulnerability_count: number;
  vulnerabilities: any[];
  error?: string;
}

export interface ChatResponse {
  response: string;
  session_id?: number;
  message_id?: number;
  tokens_used?: number;
  user_context?: any;
  suggestions?: string[];
  file_analyses?: FileAnalysis[];
  total_vulnerabilities?: number;
}

export interface FileUploadResponse {
  files_processed: number;
  files_analyzed: number;
  total_vulnerabilities: number;
  ai_response: string;
  file_details: FileAnalysis[];
}

class AIChatService {
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || "http://localhost:8000";
  }

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem("access_token");
    return {
      "Authorization": `Bearer ${token}`,
    };
  }

  async sendMessage(
    message: string,
    conversationHistory: ChatMessage[] = []
  ): Promise<ChatResponse> {
    const response = await fetch(`${this.baseURL}/api/v1/ai-chat/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify({
        message,
        conversation_history: conversationHistory,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async sendMessageWithFiles(
    message: string,
    files: File[],
    conversationHistory: ChatMessage[] = []
  ): Promise<ChatResponse> {
    const formData = new FormData();
    formData.append("message", message);
    
    // Add files to form data
    files.forEach((file) => {
      formData.append("files", file);
    });

    // Add conversation history as JSON string
    if (conversationHistory.length > 0) {
      formData.append("conversation_history", JSON.stringify(conversationHistory));
    }

    const response = await fetch(`${this.baseURL}/api/v1/ai-chat/chat-with-files`, {
      method: "POST",
      headers: {
        ...this.getAuthHeaders(),
        // Don't set Content-Type - let browser set it with boundary for multipart
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`File upload failed: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  async uploadFilesForAnalysis(files: File[]): Promise<FileUploadResponse> {
    const formData = new FormData();
    
    files.forEach((file) => {
      formData.append("files", file);
    });

    const response = await fetch(`${this.baseURL}/api/v1/ai-chat/upload-files`, {
      method: "POST",
      headers: {
        ...this.getAuthHeaders(),
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`File analysis failed: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  async executeCommand(command: string): Promise<ChatResponse> {
    const response = await fetch(`${this.baseURL}/api/v1/ai-chat/command/${command}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...this.getAuthHeaders(),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getUserContext(): Promise<{ context: any }> {
    const response = await fetch(`${this.baseURL}/api/v1/ai-chat/context`, {
      method: "GET",
      headers: {
        ...this.getAuthHeaders(),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getQuickResponses(): Promise<{ quick_responses: any[] }> {
    const response = await fetch(`${this.baseURL}/api/v1/ai-chat/quick-responses`, {
      method: "GET",
      headers: {
        ...this.getAuthHeaders(),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Utility method to validate file types
  validateFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedExtensions = [
      '.py', '.js', '.jsx', '.ts', '.tsx', '.php', '.java',
      '.cpp', '.c', '.cs', '.rb', '.go', '.rs', '.swift',
      '.sql', '.sh', '.bash', '.yaml', '.yml', '.json',
      '.xml', '.html', '.css'
    ];

    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File "${file.name}" is too large. Maximum size is 10MB.`
      };
    }

    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedExtensions.includes(extension)) {
      return {
        valid: false,
        error: `File type "${extension}" is not supported. Supported types: ${allowedExtensions.join(', ')}`
      };
    }

    return { valid: true };
  }

  // Utility method to validate multiple files
  validateFiles(files: File[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    for (const file of files) {
      const validation = this.validateFile(file);
      if (!validation.valid && validation.error) {
        errors.push(validation.error);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export const aiChatService = new AIChatService();
