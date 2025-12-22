import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface User {
  id: number;
  email?: string | null;
  github_username?: string | null;
  gitlab_username?: string | null; 
  bitbucket_username?: string | null;
  google_email?: string | null;
  full_name: string;
  avatar_url: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  // Helper methods to determine auth provider
  getAuthProvider: () => 'github' | 'gitlab' | 'bitbucket' | 'google' | null;
  hasGitHubAuth: () => boolean;
  hasBitbucketAuth: () => boolean;
  hasGitLabAuth: () => boolean;
  hasGoogleAuth: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored token on app load
    const storedToken = localStorage.getItem("access_token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log("Parsed user from localStorage:", parsedUser); // Debug log
        
        // Normalize the parsed user data to ensure consistent field handling
        const normalizedUser: User = {
          id: parsedUser.id,
          email: parsedUser.email || null,
          github_username: parsedUser.github_username || null,
          gitlab_username: parsedUser.gitlab_username || null,
          bitbucket_username: parsedUser.bitbucket_username || null,
          google_email: parsedUser.google_email || null,
          full_name: parsedUser.full_name,
          avatar_url: parsedUser.avatar_url,
        };
        
        console.log("Normalized user from localStorage:", normalizedUser); // Debug log
        
        setToken(storedToken);
        setUser(normalizedUser);

        // Verify token with backend
        verifyToken(storedToken);
      } catch (error) {
        console.error("Error parsing stored user data:", error);
        logout();
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const verifyToken = async (token: string) => {
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:8000"
        }/api/v1/auth/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const userData = await response.json();
        console.log("User data from backend:", userData); // Debug log
        
        // Normalize the user data to ensure consistent field handling
        const normalizedUser: User = {
          id: userData.id,
          email: userData.email || null,
          github_username: userData.github_username || null,
          gitlab_username: userData.gitlab_username || null,
          bitbucket_username: userData.bitbucket_username || null,
          google_email: userData.google_email || null,
          full_name: userData.full_name,
          avatar_url: userData.avatar_url,
        };
        
        console.log("Normalized user data:", normalizedUser); // Debug log
        setUser(normalizedUser);
        
        // Also update localStorage with normalized data
        localStorage.setItem("user", JSON.stringify(normalizedUser));
      } else {
        // Token is invalid, clear storage
        logout();
      }
    } catch (error) {
      console.error("Token verification failed:", error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = (token: string, user: User) => {
    console.log("Login called with user:", user); // Debug log
    
    // Normalize the user data to ensure consistent field handling
    const normalizedUser: User = {
      id: user.id,
      email: user.email || null,
      github_username: user.github_username || null,
      gitlab_username: user.gitlab_username || null,
      bitbucket_username: user.bitbucket_username || null,
      google_email: user.google_email || null,
      full_name: user.full_name,
      avatar_url: user.avatar_url,
    };
    
    console.log("Normalized user data in login:", normalizedUser); // Debug log
    
    setToken(token);
    setUser(normalizedUser);
    localStorage.setItem("access_token", token);
    localStorage.setItem("user", JSON.stringify(normalizedUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    // Redirect to login page
    window.location.href = "/signin";
  };

  // Helper methods to determine authentication provider
  const getAuthProvider = (): 'github' | 'gitlab' | 'bitbucket' | 'google' | null => {
    console.log("getAuthProvider called, user:", user); // Debug log
    if (!user) return null;
    
    // Check in order of priority/completeness
    if (user.github_username && user.github_username !== null && user.github_username !== '') {
      console.log("Found GitHub username:", user.github_username);
      return 'github';
    }
    if (user.bitbucket_username && user.bitbucket_username !== null && user.bitbucket_username !== '') {
      console.log("Found Bitbucket username:", user.bitbucket_username);
      return 'bitbucket';
    }
    if (user.gitlab_username && user.gitlab_username !== null && user.gitlab_username !== '') {
      console.log("Found GitLab username:", user.gitlab_username);
      return 'gitlab';
    }
    if (user.google_email && user.google_email !== null && user.google_email !== '') {
      console.log("Found Google email:", user.google_email);
      return 'google';
    }
    
    console.log("No auth provider found");
    return null;
  };

  const hasGitHubAuth = () => {
    const hasAuth = !!(user?.github_username && user.github_username !== null && user.github_username !== '');
    console.log("hasGitHubAuth:", hasAuth, user?.github_username);
    return hasAuth;
  };

  const hasBitbucketAuth = () => {
    const hasAuth = !!(user?.bitbucket_username && user.bitbucket_username !== null && user.bitbucket_username !== '');
    console.log("hasBitbucketAuth:", hasAuth, user?.bitbucket_username);
    return hasAuth;
  };

  const hasGitLabAuth = () => {
    const hasAuth = !!(user?.gitlab_username && user.gitlab_username !== null && user.gitlab_username !== '');
    console.log("hasGitLabAuth:", hasAuth, user?.gitlab_username);
    return hasAuth;
  };

  const hasGoogleAuth = () => {
    const hasAuth = !!(user?.google_email && user.google_email !== null && user.google_email !== '');
    console.log("hasGoogleAuth:", hasAuth, user?.google_email);
    return hasAuth;
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    isLoading,
    isAuthenticated: !!user && !!token,
    getAuthProvider,
    hasGitHubAuth,
    hasBitbucketAuth,
    hasGitLabAuth,
    hasGoogleAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
