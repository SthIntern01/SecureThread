// DEPRECATED: Bitbucket now uses full redirect flow like GitHub
// This file is kept for reference only
import React, { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { EtherealBackground } from "../components/ui/ethereal-background";

const BitbucketCallback = () => {
  const [searchParams] = useSearchParams();

  
  useEffect(() => {

  console.log("BitbucketCallback: Component mounted");
  console.log("BitbucketCallback: Search params:", Object.fromEntries(searchParams));
  console.log("BitbucketCallback: Has window.opener?", !!window.opener);
  
    
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const error_description = searchParams.get("error_description");

    console.log("BitbucketCallback: Code:", code);
  console.log("BitbucketCallback: State:", state);  
  console.log("BitbucketCallback: Error:", error);
  console.log("BitbucketCallback: Error description:", error_description);
    // This check is crucial to ensure we're in a popup
    if (window.opener) {
      if (error) {
        // If Bitbucket returned an error, send it to the parent window
        window.opener.postMessage(
          { 
            type: "oauth-error", 
            error,
            error_description: error_description || error
          },
          window.location.origin
        );
      } else if (code && state) {
        // If successful, send the code and state back to the parent window
        window.opener.postMessage(
          { type: "oauth-success", code, state, provider: "bitbucket" },
          window.location.origin
        );
      } else {
        // If neither code nor error, something went wrong
        window.opener.postMessage(
          { 
            type: "oauth-error", 
            error: "invalid_response",
            error_description: "No authorization code or error received from Bitbucket"
          },
          window.location.origin
        );
      }
    }

    // After sending the message, close the popup
    window.close();
  }, [searchParams]);

  // This UI will only be visible for a split second before the window closes
  return (
    <div className="min-h-screen w-full relative flex items-center justify-center bg-[#111111]">
      <EtherealBackground
        color="rgba(0, 82, 204, 0.6)"
        animation={{ scale: 100, speed: 90 }}
        noise={{ opacity: 0.8, scale: 1.2 }}
        sizing="fill"
      />
      <div className="relative z-10 text-center text-white">
        <h2 className="text-xl font-semibold">Authenticating with Bitbucket...</h2>
        <p>Please wait, you will be redirected shortly.</p>
      </div>
    </div>
  );
};

export default BitbucketCallback;