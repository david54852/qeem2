import { createClient } from "../../../../../supabase/server";
import { NextResponse } from "next/server";
import { fetchSnapTradeHoldings } from "@/utils/snaptrade";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  console.log("SnapTrade callback received with URL:", requestUrl.toString());

  // Log all query parameters for debugging
  requestUrl.searchParams.forEach((value, key) => {
    console.log(`Query param: ${key} = ${value}`);
  });

  const userId = requestUrl.searchParams.get("userId");
  const accountId = requestUrl.searchParams.get("accountId");
  const success = requestUrl.searchParams.get("success") === "true";
  const code = requestUrl.searchParams.get("code"); // Some APIs return a code parameter

  // If we don't have userId but have a code, this might be an OAuth callback
  if (code && !userId) {
    console.log("Received OAuth code but no userId, attempting to process");
    // Here you would handle the OAuth flow if needed
  }

  if (!userId) {
    console.log("No userId found in callback, redirecting to assets page");
    return NextResponse.redirect(
      new URL("/dashboard/assets?error=missing_user_id", requestUrl.origin),
    );
  }

  if (!success) {
    console.log("Success parameter is not true, redirecting with error");
    return NextResponse.redirect(
      new URL("/dashboard/assets?error=connection_failed", requestUrl.origin),
    );
  }

  try {
    console.log("Creating Supabase client for user verification");
    const supabase = await createClient();

    // Get the current user to verify they match the userId from SnapTrade
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("Error getting user:", userError);
      throw new Error(`Auth error: ${userError.message}`);
    }

    if (!user) {
      console.error("No authenticated user found");
      throw new Error("No authenticated user");
    }

    if (user.id !== userId) {
      console.error("User mismatch:", {
        authUserId: user.id,
        callbackUserId: userId,
      });
      throw new Error("User mismatch");
    }

    console.log("User verified, fetching holdings from SnapTrade");
    // Fetch holdings from SnapTrade
    const holdings = await fetchSnapTradeHoldings(userId);
    console.log(`Retrieved ${holdings.length} holdings from SnapTrade`);

    // Get category ID for investments
    const { data: categoryData, error: categoryError } = await supabase
      .from("asset_categories")
      .select("id")
      .eq("slug", "investments")
      .single();

    if (categoryError) {
      console.error("Error getting investment category:", categoryError);
      throw new Error(`Category error: ${categoryError.message}`);
    }

    if (!categoryData) {
      console.error("Investment category not found");
      throw new Error("Category not found");
    }

    console.log("Adding holdings to database");
    // For each holding, add it to the database
    for (const holding of holdings) {
      console.log(
        `Processing holding: ${holding.symbol} (${holding.quantity} shares)`,
      );

      // Insert the stock as an asset
      const { error: insertError } = await supabase.from("assets").insert({
        name: holding.name,
        value: holding.totalValue,
        description: `${holding.quantity} shares of ${holding.symbol}`,
        location: "SnapTrade",
        acquisition_date: new Date().toISOString(),
        acquisition_value: holding.totalValue - holding.gainLoss,
        category_id: categoryData.id,
        is_liability: false,
        user_id: user.id,
        metadata: {
          symbol: holding.symbol,
          price_per_share: holding.pricePerShare,
          quantity: holding.quantity,
          currency: "USD",
          asset_type: "stock",
          source: "snaptrade",
          account_id: accountId,
        },
      });

      if (insertError) {
        console.error(`Error inserting asset ${holding.symbol}:`, insertError);
      }
    }

    console.log(
      "Successfully processed all holdings, redirecting to assets page",
    );
    // Redirect to assets page with success message
    return NextResponse.redirect(
      new URL("/dashboard/assets?success=true", requestUrl.origin),
    );
  } catch (error) {
    console.error("Error processing SnapTrade callback:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // Redirect with error
    return NextResponse.redirect(
      new URL(
        `/dashboard/assets?error=true&message=${encodeURIComponent(errorMessage)}`,
        requestUrl.origin,
      ),
    );
  }
}
