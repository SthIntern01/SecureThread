import React, { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { EtherealBackground } from "../components/ui/ethereal-background";

const BitbucketCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = React.useState("");

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const errorParam = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    console.log("BitbucketCallback: Component mounted");
    console.log("BitbucketCallback: Code:", code?.substring(0, 10) + "...");
    console.log("BitbucketCallback: State:", state);
    console.log("BitbucketCallback: Error:", errorParam);

    if (errorParam) {
      setError(errorDescription || errorParam);
      setTimeout(() => navigate("/signin"), 3000);
      return;
    }

    if (code && state === "securethread_bitbucket_auth") {
      handleBitbucketCallback(code);
    } else {
      setError("Invalid callback parameters");
      setTimeout(() => navigate("/signin"), 3000);
    }
  }, [searchParams]);

  const handleBitbucketCallback = async (code: string) => {
    try {
      console.log("Processing Bitbucket callback...");

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/auth/bitbucket/callback`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Authentication failed: ${response.status}`);
      }

      const data = await response.json();
      console.log("Bitbucket callback successful");

      if (data.access_token) {
        login(data.access_token, data.user || {});
        navigate("/", { replace: true });
      } else {
        throw new Error("Invalid response from server - no access token");
      }
    } catch (err) {
      console.error("Bitbucket callback error:", err);
      setError(err instanceof Error ? err.message : "Failed to sign in with Bitbucket");
      setTimeout(() => navigate("/signin"), 3000);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center bg-[#111111]">
      <EtherealBackground
        color="rgba(0, 82, 204, 0.6)"
        animation={{ scale: 100, speed: 90 }}
        noise={{ opacity: 0.8, scale: 1.2 }}
        sizing="fill"
      />
      <div className="relative z-10 text-center theme-text">
        {error ? (
          <>
            <h2 className="text-xl font-semibold text-red-400 mb-2">
              Authentication Failed
            </h2>
            <p className="text-gray-300">{error}</p>
            <p className="text-sm text-gray-400 mt-4">
              Redirecting to sign in page...
            </p>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold">
              Authenticating with Bitbucket...
            </h2>
            <p>Please wait, you will be redirected shortly.</p>
          </>
        )}
      </div>
    </div>
  );
};

export default BitbucketCallback;