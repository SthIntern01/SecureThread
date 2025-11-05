import React, { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { EtherealBackground } from "../components/ui/ethereal-background";

const GitLabCallback = () => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // This check is crucial to ensure we're in a popup
    if (window.opener) {
      if (error) {
        // If GitLab returned an error, send it to the parent window
        window.opener.postMessage(
          { type: "oauth-error", error },
          window.location.origin
        );
      } else if (code && state) {
        // If successful, send the code and state back to the parent window
        window.opener.postMessage(
          { type: "oauth-success", code, state },
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
        color="rgba(255, 255, 255, 0.6)"
        animation={{ scale: 100, speed: 90 }}
        noise={{ opacity: 0.8, scale: 1.2 }}
        sizing="fill"
      />
      <div className="relative z-10 text-center theme-text">
        <h2 className="text-xl font-semibold">Authenticating...</h2>
        <p>Please wait, you will be redirected shortly.</p>
      </div>
    </div>
  );
};

export default GitLabCallback;
