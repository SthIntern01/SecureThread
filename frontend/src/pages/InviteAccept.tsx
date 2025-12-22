import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { teamService } from '../services/teamService';
import { EtherealBackground } from '../components/ui/ethereal-background';
import { Button } from '@/components/ui/button';
import { Loader2, Check, AlertCircle, Users } from 'lucide-react';

const InviteAccept = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const workspaceContext = useWorkspace();
  
  const token = searchParams.get('token');
  const [inviteDetails, setInviteDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [hasAttemptedAccept, setHasAttemptedAccept] = useState(false);

  // Store token when page loads
  useEffect(() => {
    if (token) {
      console.log('💾 Storing invitation token:', token);
      sessionStorage.setItem('pending_invitation_token', token);
      loadInvitationDetails();
    } else {
      // Check if there's a stored token
      const storedToken = sessionStorage.getItem('pending_invitation_token');
      if (storedToken) {
        console.log('📥 Found stored invitation token:', storedToken);
        loadInvitationDetails();
      } else {
        setError('No invitation token found');
        setLoading(false);
      }
    }
  }, [token]);

  // Auto-accept when user logs in
  useEffect(() => {
    const storedToken = sessionStorage.getItem('pending_invitation_token');
    
    console.log('🔍 Checking auto-accept conditions:', {
      isAuthenticated,
      hasStoredToken: !!storedToken,
      accepting,
      success,
      hasAttemptedAccept,
      user
    });

    if (isAuthenticated && storedToken && !accepting && !success && !hasAttemptedAccept) {
      console.log('✨ Auto-accepting invitation for logged-in user');
      setHasAttemptedAccept(true);
      handleAcceptInvite();
    }
  }, [isAuthenticated, user, accepting, success, hasAttemptedAccept]);

  const loadInvitationDetails = async () => {
    const inviteToken = token || sessionStorage.getItem('pending_invitation_token');
    
    if (! inviteToken) {
      setError('No invitation token found');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      console.log('📨 Loading invitation details for token:', inviteToken);
      const details = await teamService.getInvitationDetails(inviteToken);
      console.log('✅ Invitation details loaded:', details);
      setInviteDetails(details);
    } catch (err: any) {
      console.error('❌ Error loading invitation:', err);
      setError(err.message || 'Failed to load invitation details');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = async () => {
    const inviteToken = token || sessionStorage.getItem('pending_invitation_token');
    
    if (!inviteToken) {
      setError('No invitation token found');
      return;
    }

    if (! isAuthenticated) {
      console.log('🔒 User not authenticated, redirecting to sign in');
      const currentUrl = `/accept-invite? token=${inviteToken}`;
      navigate(`/signin?redirect=${encodeURIComponent(currentUrl)}`);
      return;
    }

    try {
      setAccepting(true);
      setError('');
      
      console.log('🎯 Accepting invitation with token:', inviteToken);
      console.log('👤 Current user:', user);
      
      // Accept the invitation
      const result = await teamService.acceptInvitation(inviteToken);
      console.log('✅ Invitation accepted successfully:', result);
      console.log('📦 New team_id:', result.team_id);
      
      // Clear the pending token
      sessionStorage.removeItem('pending_invitation_token');
      
      setSuccess(true);
      
      // Wait to show success message
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // ✅ CRITICAL: Store the new team ID so we can switch to it
      sessionStorage.setItem('switch_to_workspace', result.team_id. toString());
      
      console.log('🔄 Stored team ID for switching:', result.team_id);
      console.log('🚀 Redirecting to dashboard with full reload');
      
      // Redirect to dashboard with full reload
      window.location.href = '/';
      
    } catch (err:  any) {
      console.error('❌ Error accepting invitation:', err);
      setError(err.message || 'Failed to accept invitation');
      setAccepting(false);
      setHasAttemptedAccept(false);
    }

  };

  const handleDecline = () => {
    sessionStorage.removeItem('pending_invitation_token');
    navigate('/');
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <EtherealBackground
          color="rgba(255, 255, 255, 0.6)"
          animation={{ scale: 100, speed: 90 }}
          noise={{ opacity: 0.8, scale: 1.2 }}
          sizing="fill"
        />
        <div className="bg-gray-100/80 dark:bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8 max-w-md w-full text-center relative z-10">
          <Loader2 className="w-12 h-12 animate-spin theme-text mx-auto mb-4" />
          <p className="theme-text">Loading invitation details... </p>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <EtherealBackground
          color="rgba(255, 255, 255, 0.6)"
          animation={{ scale: 100, speed: 90 }}
          noise={{ opacity: 0.8, scale: 1.2 }}
          sizing="fill"
        />
        <div className="bg-gray-100/80 dark:bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8 max-w-md w-full text-center relative z-10">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-xl font-semibold theme-text mb-2">Welcome to the Team!</h2>
          <p className="text-white/70 mb-6">
            You've successfully joined {inviteDetails?. team_name}.  Redirecting to your workspace... 
          </p>
          <div className="flex items-center justify-center">
            <Loader2 className="w-4 h-4 animate-spin theme-text mr-2" />
            <span className="text-white/70">Redirecting...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !inviteDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <EtherealBackground
          color="rgba(255, 255, 255, 0.6)"
          animation={{ scale: 100, speed: 90 }}
          noise={{ opacity: 0.8, scale: 1.2 }}
          sizing="fill"
        />
        <div className="bg-gray-100/80 dark:bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8 max-w-md w-full text-center relative z-10">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-semibold theme-text mb-2">Invalid Invitation</h2>
          <p className="text-white/70 mb-6">{error || 'This invitation link is invalid or has expired.'}</p>
          <Button onClick={() => navigate('/')} className="w-full bg-accent hover:bg-accent/90">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  // Main invitation display
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <EtherealBackground
        color="rgba(255, 255, 255, 0.6)"
        animation={{ scale: 100, speed: 90 }}
        noise={{ opacity: 0.8, scale: 1.2 }}
        sizing="fill"
      />
      <div className="bg-gray-100/80 dark:bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8 max-w-md w-full relative z-10">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-accent" />
          </div>
          <h2 className="text-2xl font-bold theme-text mb-2">Team Invitation</h2>
          <p className="text-white/70">You've been invited to join a workspace</p>
        </div>

        <div className="theme-bg-subtle rounded-lg p-4 space-y-2 mb-6">
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
        </div>

        {! isAuthenticated && (
          <div className="bg-blue-500/20 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-200">
              You need to sign in to accept this invitation
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/20 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-200">{error}</p>
          </div>
        )}

        <div className="space-y-3">
          <Button
            onClick={handleAcceptInvite}
            disabled={accepting}
            className="w-full bg-accent hover:bg-accent/90"
          >
            {accepting ?  (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isAuthenticated ? 'Accepting.. .' : 'Redirecting to Sign In... '}
              </>
            ) : (
              isAuthenticated ?  'Accept Invitation' : 'Sign In to Accept'
            )}
          </Button>
          <Button
            onClick={handleDecline}
            variant="outline"
            disabled={accepting}
            className="w-full border-white/20 theme-text"
          >
            Decline
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InviteAccept;
