import { NextResponse } from "next/server";
import { createClient } from "../../../../../supabase/server";
import { createSnapTradeUserLink } from "@/utils/snaptrade";

// Set cache control headers to prevent caching
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const { userId, brokerId, callbackUrl } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    if (!callbackUrl) {
      return NextResponse.json(
        { error: "Callback URL is required" },
        { status: 400 },
      );
    }

    console.log("Creating SnapTrade link for user:", userId);
    console.log("Using callback URL:", callbackUrl);
    console.log("Selected broker:", brokerId || "none");

    // Create a link for the user with the selected broker
    try {
      console.log("Attempting to create SnapTrade user link with params:", {
        userId,
        callbackUrl,
        brokerId: brokerId || "none",
      });

      const redirectUri = await createSnapTradeUserLink(
        userId,
        callbackUrl,
        brokerId,
      );

      // Store the connection attempt in the database
      try {
        const supabase = await createClient();
        await supabase
          .from("broker_connections")
          .insert({
            user_id: userId,
            broker_id: brokerId || "snaptrade",
            api_key: "pending_connection",
            api_secret_encrypted: "pending_connection",
            is_active: false,
            broker_data: { connection_started: new Date().toISOString() },
          })
          .select();
      } catch (dbError) {
        // Log but don't fail if database operation fails
        console.error("Failed to record connection attempt:", dbError);
      }

      // Add cache control headers to prevent caching
      return NextResponse.json(
        { redirectUri },
        {
          headers: {
            "Cache-Control": "no-store, max-age=0, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        },
      );
    } catch (error) {
      console.error("Error creating SnapTrade user link:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Check if the error message contains HTML indicators
      if (
        errorMessage.includes("<!DOCTYPE") ||
        errorMessage.includes("<html")
      ) {
        return NextResponse.json(
          {
            error:
              "Received HTML response from SnapTrade API. The service might be down or experiencing issues.",
          },
          {
            status: 502,
            headers: {
              "Cache-Control": "no-store, max-age=0, must-revalidate",
              Pragma: "no-cache",
              Expires: "0",
            },
          },
        );
      }

      throw error; // Re-throw to be caught by the outer catch block
    }
  } catch (error) {
    console.error("Error creating SnapTrade link:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: errorMessage },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, max-age=0, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    );
  }
}
