// Create this as a new file: frontend/src/hooks/use-bitbucket-auth.ts

import { useState } from 'react';

interface BitbucketAuthResult {
  success: boolean;
  token?: string;
  user?: any;
  error?: string;
}

export const useBitbucketAuth = () => {
  const [isConnecting, setIsConnecting] = useState(false);

  const connectBitbucket = async (): Promise<BitbucketAuthResult> => {
    setIsConnecting(true);
    
    try {
      // Get the authorization URL from backend
      const authResponse = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/auth/bitbucket/auth-url`
      );
      
      if (!authResponse.ok) {
        throw new Error('Failed to get authorization URL');
      }
      
      const { authorization_url } = await authResponse.json();
      
      // Open popup window for OAuth
      return new Promise((resolve) => {
        const popup = window.open(
          authorization_url,
          'bitbucket-oauth',
          'width=600,height=700,scrollbars=yes,resizable=yes'
        );
        
        // Listen for messages from the popup
        const handleMessage = async (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;
          
          if (event.data.type === 'oauth-success' && event.data.provider === 'bitbucket') {
            try {
              // Exchange the code for token
              const tokenResponse = await fetch(
                `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/auth/bitbucket/callback`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    code: event.data.code
                  })
                }
              );
              
              if (tokenResponse.ok) {
                const result = await tokenResponse.json();
                window.removeEventListener('message', handleMessage);
                popup?.close();
                resolve({
                  success: true,
                  token: result.access_token,
                  user: result.user
                });
              } else {
                const errorData = await tokenResponse.json();
                window.removeEventListener('message', handleMessage);
                popup?.close();
                resolve({
                  success: false,
                  error: errorData.detail || 'Authentication failed'
                });
              }
            } catch (error) {
              window.removeEventListener('message', handleMessage);
              popup?.close();
              resolve({
                success: false,
                error: 'Failed to process authentication'
              });
            }
          } else if (event.data.type === 'oauth-error') {
            window.removeEventListener('message', handleMessage);
            popup?.close();
            resolve({
              success: false,
              error: event.data.error_description || event.data.error
            });
          }
        };
        
        window.addEventListener('message', handleMessage);
        
        // Handle popup being closed manually
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed);
            window.removeEventListener('message', handleMessage);
            resolve({
              success: false,
              error: 'Authentication was cancelled'
            });
          }
        }, 1000);
      });
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      };
    } finally {
      setIsConnecting(false);
    }
  };

  return {
    connectBitbucket,
    isConnecting
  };
};