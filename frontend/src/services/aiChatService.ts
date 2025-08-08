interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp?: string;
  }
  
  interface ChatResponse {
    response: string;
    tokens_used?: number;
    user_context?: any;
    suggestions?: string[];
  }
  
  interface QuickResponse {
    label: string;
    description: string;
    response: string;
  }
  
  class AIChatService {
    private baseUrl: string;
    private getAuthHeaders: () => Record<string, string>;
  
    constructor() {
      this.baseUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/ai-chat`;
      this.getAuthHeaders = () => ({
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json',
      });
    }
  
    async sendMessage(
      message: string, 
      conversationHistory: ChatMessage[] = [],
      repositoryId?: number
    ): Promise<ChatResponse> {
      try {
        const response = await fetch(`${this.baseUrl}/chat`, {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({
            message,
            conversation_history: conversationHistory,
            repository_id: repositoryId
          })
        });
  
        if (!response.ok) {
          throw new Error(`Chat request failed: ${response.status}`);
        }
  
        return await response.json();
      } catch (error) {
        console.error('Error sending chat message:', error);
        throw error;
      }
    }
  
    async executeCommand(command: string): Promise<ChatResponse> {
      try {
        const response = await fetch(`${this.baseUrl}/command/${command}`, {
          method: 'POST',
          headers: this.getAuthHeaders()
        });
  
        if (!response.ok) {
          throw new Error(`Command execution failed: ${response.status}`);
        }
  
        return await response.json();
      } catch (error) {
        console.error('Error executing command:', error);
        throw error;
      }
    }
  
    async getRecommendations(repositoryId?: number): Promise<any> {
      try {
        const response = await fetch(`${this.baseUrl}/recommendations`, {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({
            repository_id: repositoryId
          })
        });
  
        if (!response.ok) {
          throw new Error(`Recommendations request failed: ${response.status}`);
        }
  
        return await response.json();
      } catch (error) {
        console.error('Error getting recommendations:', error);
        throw error;
      }
    }
  
    async analyzeVulnerability(vulnerabilityId: number, includeFileContent: boolean = false): Promise<any> {
      try {
        const response = await fetch(`${this.baseUrl}/analyze-vulnerability`, {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({
            vulnerability_id: vulnerabilityId,
            include_file_content: includeFileContent
          })
        });
  
        if (!response.ok) {
          throw new Error(`Vulnerability analysis failed: ${response.status}`);
        }
  
        return await response.json();
      } catch (error) {
        console.error('Error analyzing vulnerability:', error);
        throw error;
      }
    }
  
    async getQuickResponses(): Promise<QuickResponse[]> {
      try {
        const response = await fetch(`${this.baseUrl}/quick-responses`, {
          headers: this.getAuthHeaders()
        });
  
        if (!response.ok) {
          throw new Error(`Quick responses request failed: ${response.status}`);
        }
  
        const data = await response.json();
        return data.quick_responses;
      } catch (error) {
        console.error('Error getting quick responses:', error);
        return [];
      }
    }
  
    async getUserContext(): Promise<any> {
      try {
        const response = await fetch(`${this.baseUrl}/context`, {
          headers: this.getAuthHeaders()
        });
  
        if (!response.ok) {
          throw new Error(`Context request failed: ${response.status}`);
        }
  
        return await response.json();
      } catch (error) {
        console.error('Error getting user context:', error);
        return { context: {} };
      }
    }
  }
  
  export const aiChatService = new AIChatService();
  export type { ChatMessage, ChatResponse, QuickResponse };