"use client";

import { useState, useEffect } from "react";
import { createClient } from "../../../supabase/client";

export default function HandleSnapTradeConnection({
  userId,
  brokerId,
  onSuccess,
  onError,
}: {
  userId: string;
  brokerId: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}) {
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const connectToBroker = async () => {
      try {
        // Create a link for the user
        const origin = window.location.origin;
        const callbackUrl = `${origin}/api/snaptrade/callback?userId=${userId}`;

        console.log("Starting SnapTrade linking process for user:", userId);
        console.log("Using callback URL:", callbackUrl);
        console.log("Selected broker:", brokerId);

        // Use the API route to avoid CORS issues with retry logic
        const fetchWithRetry = async (retries = 3, delay = 1000) => {
          try {
            return await fetch("/api/snaptrade/connect", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                userId,
                brokerId,
                callbackUrl,
              }),
              cache: "no-store",
            });
          } catch (error) {
            if (retries <= 0) throw error;
            console.log(
              `Connection attempt failed, retrying in ${delay}ms... (${retries} retries left)`,
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
            return fetchWithRetry(retries - 1, delay * 2);
          }
        };

        const response = await fetchWithRetry();

        console.log("SnapTrade connection response status:", response.status);

        if (!response.ok) {
          let errorMessage = `Server error: ${response.status}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch (jsonError) {
            // If we can't parse the response as JSON, try to get the text
            try {
              const errorText = await response.text();
              console.error(
                "Non-JSON error response:",
                errorText.substring(0, 200),
              );
              errorMessage = `Server returned non-JSON response: ${response.status}`;
            } catch (textError) {
              console.error("Could not read error response", textError);
            }
          }
          throw new Error(errorMessage);
        }

        let data;
        try {
          const responseText = await response.text();
          try {
            data = JSON.parse(responseText);
          } catch (parseError) {
            console.error("Failed to parse response as JSON:", parseError);
            // Check if we received HTML
            if (
              responseText.trim().startsWith("<!DOCTYPE") ||
              responseText.trim().startsWith("<html")
            ) {
              console.error(
                "Received HTML instead of JSON:",
                responseText.substring(0, 200),
              );
              throw new Error(
                `Server returned HTML instead of JSON. The service might be experiencing issues.`,
              );
            } else {
              console.error("Raw response:", responseText);
              throw new Error(
                `Failed to parse server response: ${parseError.message}`,
              );
            }
          }
        } catch (error) {
          console.error("Error reading response:", error);
          throw new Error(
            error.message ||
              "Failed to read response from server. Please try again later.",
          );
        }
        console.log("Received redirect URI:", data.redirectUri);

        // Redirect to SnapTrade
        window.location.href = data.redirectUri;
      } catch (error) {
        console.error("Error connecting to broker:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        setError(`Failed to link account: ${errorMessage}. Please try again.`);
        onError(`Failed to link account: ${errorMessage}. Please try again.`);
        setIsConnecting(false);
      }
    };

    connectToBroker();
  }, [userId, brokerId, onSuccess, onError]);

  return (
    <div className="flex flex-col items-center justify-center p-6">
      {isConnecting && !error && (
        <>
          <div className="h-12 w-12 rounded-full border-4 border-t-transparent border-primary animate-spin mb-4"></div>
          <p className="text-lg font-medium">Connecting to {brokerId}...</p>
          <p className="text-sm text-gray-500 mt-2">
            You will be redirected to securely connect your account.
          </p>
        </>
      )}

      {error && (
        <>
          <div className="rounded-full bg-red-100 p-3 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-red-500"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <p className="text-lg font-medium text-red-600">Connection Failed</p>
          <p className="text-sm text-gray-500 mt-2 text-center">{error}</p>
        </>
      )}
    </div>
  );
}
