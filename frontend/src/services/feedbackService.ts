// frontend/src/services/feedbackService.ts

export interface FeedbackData {
  type: string;
  severity?: string;
  description: string;
  stepsToReproduce?: string;
  userEmail?: string;
}

export interface FeedbackResponse {
  tracking_id: string;
  message: string;
}

export interface FeedbackDetail {
  id: number;
  tracking_id: string;
  type: string;
  severity?: string;
  description: string;
  steps_to_reproduce?: string;
  user_email?: string;
  status: string;
  created_at: string;
  updated_at?: string;
  attachments?: Array<{
    filename: string;
    size: number;
    url?: string;
  }>;
}

export interface FeedbackList {
  items: FeedbackDetail[];
  total: number;
  page: number;
  per_page: number;
}

export interface FeedbackStats {
  total_feedback: number;
  by_type: Record<string, number>;
  by_status: Record<string, number>;
}

class FeedbackService {
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

  /**
   * Submit feedback with optional file attachments
   */
  async submitFeedback(
    feedbackData: FeedbackData, 
    attachments?: File[]
  ): Promise<FeedbackResponse> {
    try {
      const formData = new FormData();
      
      // Add feedback data to form
      formData.append('type', feedbackData.type);
      if (feedbackData.severity) {
        formData.append('severity', feedbackData.severity);
      }
      formData.append('description', feedbackData.description);
      if (feedbackData.stepsToReproduce) {
        formData.append('stepsToReproduce', feedbackData.stepsToReproduce);
      }
      if (feedbackData.userEmail) {
        formData.append('userEmail', feedbackData.userEmail);
      }
      
      // Add attachments
      if (attachments && attachments.length > 0) {
        attachments.forEach((file) => {
          formData.append('attachments', file);
        });
      }
      
      const response = await fetch(`${this.baseURL}/api/v1/feedback/feedback`, {
        method: "POST",
        headers: {
          ...this.getAuthHeaders(),
          // Don't set Content-Type - let browser set it with boundary for multipart
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to submit feedback';
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.detail || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  }

  /**
   * Get feedback by tracking ID
   */
  async getFeedback(trackingId: string): Promise<FeedbackDetail> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/feedback/feedback/${trackingId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...this.getAuthHeaders(),
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Feedback not found');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error fetching feedback:', error);
      throw error;
    }
  }

  /**
   * Get user's feedback list
   */
  async getUserFeedback(page: number = 1, perPage: number = 20): Promise<FeedbackList> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString(),
      });

      const response = await fetch(`${this.baseURL}/api/v1/feedback/feedback?${params}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...this.getAuthHeaders(),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error fetching user feedback:', error);
      throw error;
    }
  }

  /**
   * Get feedback statistics
   */
  async getFeedbackStats(): Promise<FeedbackStats> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/feedback/feedback/stats`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...this.getAuthHeaders(),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error fetching feedback stats:', error);
      throw error;
    }
  }

  /**
   * Update feedback status (admin only)
   */
  async updateFeedbackStatus(trackingId: string, status: string): Promise<{ message: string; tracking_id: string }> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/feedback/feedback/${trackingId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...this.getAuthHeaders(),
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error updating feedback status:', error);
      throw error;
    }
  }

  /**
   * Validate file before upload
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedExtensions = ['.png', '.jpg', '.jpeg', '.pdf', '.txt', '.log', '.json', '.yaml', '.yml'];

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

  /**
   * Validate multiple files
   */
  validateFiles(files: File[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (files.length > 5) {
      errors.push('Maximum 5 files allowed');
    }
    
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

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export const feedbackService = new FeedbackService();
