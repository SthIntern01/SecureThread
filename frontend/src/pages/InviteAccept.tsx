import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom"; // ✅ Changed from useParams
import { Button } from "@/components/ui/button";
import { teamService } from '../services/teamService';
import { useAuth } from "../contexts/AuthContext";
import { UserPlus, Users, Check, X, Loader2 } from "lucide-react";

const InviteAccept = () => {
  const [searchParams] = useSearchParams(); // ✅ Changed from useParams
  const token = searchParams.get('token'); // ✅ Get token from query params
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  const [inviteDetails, setInviteDetails] = useState<{
    team_name: string;
    role: string;
    invited_by: string;
    expires_at: string;
  } | null>(null);

  useEffect(() => {
    if (token) {
      loadInviteDetails();
    } else {
      setError("No invitation token provided");
      setLoading(false);
    }
  }, [token]);

  const loadInviteDetails = async () => {
    try {
      setLoading(true);
      setError("");
      
      const details = await teamService.getInvitationDetails(token!);
      setInviteDetails(details);
    } catch (error) {
      setError("Invalid or expired invitation link");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = async () => {
    if (!isAuthenticated) {
      // ✅ Fixed redirect URL to use query params
      navigate(`/signin?redirect=/accept-invite?token=${token}`);
      return;
    }

    try {
      setAccepting(true);
      setError("");
      
      await teamService.acceptInvitation(token!);
      setSuccess(true);
      
      // Redirect to members page after 2 seconds
      setTimeout(() => {
        navigate('/members');
      }, 2000);
      
    } catch (error) {
      setError("Failed to accept invitation");
      console.error(error);
    } finally {
      setAccepting(false);
    }
  };

  const handleDecline = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-gray-100/80 dark:bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8 max-w-md w-full text-center">
          <Loader2 className="w-8 h-8 animate-spin theme-text mx-auto mb-4" />
          <h2 className="text-xl font-semibold theme-text mb-2">Loading Invitation...</h2>
          <p className="text-white/70">Please wait while we verify your invitation.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-gray-100/80 dark:bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-semibold theme-text mb-2">Invalid Invitation</h2>
          <p className="text-white/70 mb-6">{error}</p>
          <Button onClick={() => navigate('/')} className="w-full">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-gray-100/80 dark:bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-xl font-semibold theme-text mb-2">Welcome to the Team!</h2>
          <p className="text-white/70 mb-6">You've successfully joined {inviteDetails?.team_name}. Redirecting to the members page...</p>
          <div className="flex items-center justify-center">
            <Loader2 className="w-4 h-4 animate-spin theme-text mr-2" />
            <span className="text-white/70">Redirecting...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-gray-100/80 dark:bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-accent/20 to-accent/40 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8 text-accent" />
          </div>
          <h1 className="text-2xl font-bold theme-text mb-2">You're Invited!</h1>
          <p className="text-white/70">Join your team on SecureThread</p>
        </div>

        {inviteDetails && (
          <div className="space-y-4 mb-6">
            <div className="theme-bg-subtle rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-white/70">Team:</span>
                <span className="theme-text font-medium">{inviteDetails.team_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Role:</span>
                <span className="theme-text font-medium">{inviteDetails.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Invited by:</span>
                <span className="theme-text font-medium">{inviteDetails.invited_by}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Expires:</span>
                <span className="theme-text font-medium">
                  {new Date(inviteDetails.expires_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            {!isAuthenticated && (
              <div className="bg-blue-500/20 rounded-lg p-4">
                <p className="text-blue-200 text-sm">
                  You need to sign in to accept this invitation. You'll be redirected back here after signing in.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="space-y-3">
          <Button
            onClick={handleAcceptInvite}
            disabled={accepting}
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            {accepting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isAuthenticated ? "Accepting..." : "Redirecting to Sign In..."}
              </>
            ) : (
              <>
                <Users className="w-4 h-4 mr-2" />
                {isAuthenticated ? "Accept Invitation" : "Sign In & Accept"}
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={handleDecline}
            disabled={accepting}
            className="w-full"
          >
            Decline
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InviteAccept;