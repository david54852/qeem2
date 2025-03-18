/**
 * Functions for interacting with the SnapTrade API
 */

// SnapTrade API base URL
const SNAPTRADE_API_URL = "https://api.snaptrade.com/api/v1";

// Get these from your environment variables
const CLIENT_ID = process.env.NEXT_PUBLIC_SNAPTRADE_CLIENT_ID || "";
const CONSUMER_KEY = process.env.NEXT_PUBLIC_SNAPTRADE_CONSUMER_KEY || "";

// Log the presence of credentials for debugging
console.log("SnapTrade credentials loaded:", {
  clientIdPresent: !!CLIENT_ID,
  consumerKeyLength: CONSUMER_KEY ? CONSUMER_KEY.length : 0,
});

// Use a proxy for API calls if needed
const useProxy = typeof window !== "undefined";

// Helper function to handle API requests with retry logic
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 3,
  delay = 1000,
) {
  try {
    const response = await fetch(url, options);
    return response;
  } catch (error) {
    if (retries <= 0) throw error;

    console.log(
      `Fetch failed, retrying in ${delay}ms... (${retries} retries left)`,
    );
    await new Promise((resolve) => setTimeout(resolve, delay));
    return fetchWithRetry(url, options, retries - 1, delay * 2);
  }
}

/**
 * Fetches holdings from SnapTrade for a specific user
 * @param userId The user ID to fetch holdings for
 * @returns Array of holdings with detailed information
 */
export async function fetchSnapTradeHoldings(userId: string) {
  if (!CLIENT_ID || !CONSUMER_KEY) {
    throw new Error("SnapTrade API credentials not configured");
  }

  try {
    console.log("Fetching SnapTrade holdings for user:", userId);

    // First, get all accounts for the user
    const accountsResponse = await fetch(
      `${SNAPTRADE_API_URL}/accounts?userId=${encodeURIComponent(userId)}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Client-ID": CLIENT_ID,
          "Consumer-Key": CONSUMER_KEY,
        },
        cache: "no-store",
      },
    );

    if (!accountsResponse.ok) {
      const errorData = await accountsResponse.json();
      console.error("SnapTrade accounts fetch error:", errorData);
      throw new Error(`Failed to fetch accounts: ${accountsResponse.status}`);
    }

    const accounts = await accountsResponse.json();
    console.log(`Found ${accounts.length} accounts for user`);

    // For each account, get the holdings
    let allHoldings = [];
    let totalCash = 0;

    for (const account of accounts) {
      // Get account balances (cash)
      const balancesResponse = await fetch(
        `${SNAPTRADE_API_URL}/accounts/${account.id}/balances`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Client-ID": CLIENT_ID,
            "Consumer-Key": CONSUMER_KEY,
          },
        },
      );

      if (balancesResponse.ok) {
        const balances = await balancesResponse.json();
        // Add cash balance if available
        const cashBalance = balances.find(
          (b) => b.currency === "USD" && b.cash,
        );
        if (cashBalance) {
          totalCash += parseFloat(cashBalance.amount);
        }
      }

      // Get holdings
      const holdingsResponse = await fetch(
        `${SNAPTRADE_API_URL}/accounts/${account.id}/holdings`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Client-ID": CLIENT_ID,
            "Consumer-Key": CONSUMER_KEY,
          },
        },
      );

      if (!holdingsResponse.ok) {
        console.warn(`Failed to fetch holdings for account ${account.id}`);
        continue;
      }

      const holdings = await holdingsResponse.json();
      console.log(
        `Found ${holdings.length} holdings for account ${account.id}`,
      );

      // Process each holding
      for (const holding of holdings) {
        allHoldings.push({
          symbol: holding.symbol,
          name: holding.description || holding.symbol,
          quantity: parseFloat(holding.quantity),
          pricePerShare: parseFloat(holding.price),
          totalValue: parseFloat(holding.price) * parseFloat(holding.quantity),
          gainLoss: parseFloat(holding.openPnl || 0),
          purchasePrice:
            parseFloat(holding.bookValue) / parseFloat(holding.quantity),
          accountId: account.id,
          accountName: account.name,
          brokerName: account.brokerName || "SnapTrade",
        });
      }
    }

    // Add cash as a holding if there is any
    if (totalCash > 0) {
      allHoldings.push({
        symbol: "CASH",
        name: "Cash Balance",
        quantity: 1,
        pricePerShare: totalCash,
        totalValue: totalCash,
        gainLoss: 0,
        purchasePrice: totalCash,
        accountId: "cash",
        accountName: "Cash",
        brokerName: "SnapTrade",
      });
    }

    return allHoldings;
  } catch (error) {
    console.error("Error fetching SnapTrade holdings:", error);
    throw error;
  }

  // Fallback to mock data if the API call fails
  return [
    {
      symbol: "AAPL",
      name: "Apple Inc.",
      quantity: 10,
      pricePerShare: 150.25,
      totalValue: 1502.5,
      gainLoss: 250.0,
      purchasePrice: 125.25,
      accountId: "mock-account",
      accountName: "Mock Account",
      brokerName: "SnapTrade",
    },
    {
      symbol: "MSFT",
      name: "Microsoft Corporation",
      quantity: 5,
      pricePerShare: 300.75,
      totalValue: 1503.75,
      gainLoss: 175.5,
      purchasePrice: 265.65,
      accountId: "mock-account",
      accountName: "Mock Account",
      brokerName: "SnapTrade",
    },
    {
      symbol: "GOOGL",
      name: "Alphabet Inc.",
      quantity: 2,
      pricePerShare: 2750.1,
      totalValue: 5500.2,
      gainLoss: 500.3,
      purchasePrice: 2500.05,
      accountId: "mock-account",
      accountName: "Mock Account",
      brokerName: "SnapTrade",
    },
    {
      symbol: "CASH",
      name: "Cash Balance",
      quantity: 1,
      pricePerShare: 10000,
      totalValue: 10000,
      gainLoss: 0,
      purchasePrice: 10000,
      accountId: "cash",
      accountName: "Cash",
      brokerName: "SnapTrade",
    },
  ];
}

/**
 * Creates a SnapTrade user link for connecting investment accounts
 * @param userId The user ID to create the link for
 * @param redirectUri The redirect URI after connection
 * @param brokerId Optional broker ID to pre-select in the connection flow
 * @returns A redirect URI to the SnapTrade connection flow
 */
export async function createSnapTradeUserLink(
  userId: string,
  redirectUri: string,
  brokerId?: string,
) {
  if (!CLIENT_ID || !CONSUMER_KEY) {
    throw new Error("SnapTrade API credentials not configured");
  }

  try {
    console.log("Creating SnapTrade user link with:", {
      userId: userId,
      redirectUri: redirectUri,
      brokerId: brokerId,
      clientIdLength: CLIENT_ID.length,
      consumerKeyLength: CONSUMER_KEY.length,
    });

    // First, register or get the user with SnapTrade
    let userResponse;

    if (useProxy && typeof window !== "undefined") {
      // Use the CORS proxy for client-side requests
      const proxyResponse = await fetchWithRetry(
        "/api/snaptrade/connect/cors-proxy",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: `${SNAPTRADE_API_URL}/snapTrade/registerUser`,
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              "Client-ID": CLIENT_ID,
              "Consumer-Key": CONSUMER_KEY,
            },
            body: JSON.stringify({
              userId: userId,
            }),
          }),
        },
        3, // retries
        1000, // delay
      );

      let proxyData;
      let responseText;
      try {
        responseText = await proxyResponse.text();
        try {
          proxyData = JSON.parse(responseText);
        } catch (parseError) {
          console.error("Failed to parse proxy response as JSON:", parseError);
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
              `Received HTML response from SnapTrade API. The service might be down or experiencing issues. HTML preview: ${responseText.substring(0, 100)}...`,
            );
          } else {
            throw new Error(
              `Failed to parse response from SnapTrade API: ${parseError.message}. Raw response: ${responseText.substring(0, 100)}...`,
            );
          }
        }
      } catch (error) {
        if (error.message.includes("Received HTML response")) {
          throw error; // Re-throw our custom HTML error
        }
        console.error("Failed to read proxy response:", error);
        throw new Error(
          `Failed to read response from SnapTrade API: ${error.message}`,
        );
      }

      if (!proxyResponse.ok) {
        throw new Error(
          `Proxy error: ${proxyData.error || proxyResponse.statusText}`,
        );
      }

      // Check if there was an error in the proxy response
      if (proxyData.error || (proxyData.data && proxyData.data.error)) {
        throw new Error(
          `Proxy error: ${proxyData.error || proxyData.data.error || proxyResponse.statusText}`,
        );
      }

      // Create a mock Response object from the proxy data
      userResponse = new Response(JSON.stringify(proxyData.data), {
        status: proxyData.status,
        statusText: proxyData.statusText,
        headers: new Headers(proxyData.headers),
      });
    } else {
      // Direct API call for server-side requests
      userResponse = await fetchWithRetry(
        `${SNAPTRADE_API_URL}/snapTrade/registerUser`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "Client-ID": CLIENT_ID,
            "Consumer-Key": CONSUMER_KEY,
          },
          body: JSON.stringify({
            userId: userId,
          }),
        },
        3, // retries
        1000, // delay
      );
    }

    if (!userResponse.ok) {
      const errorData = await userResponse.json();
      console.error("SnapTrade user registration error:", errorData);
      throw new Error(
        `Failed to register user with SnapTrade: ${userResponse.status}`,
      );
    }

    const userData = await userResponse.json();
    console.log("SnapTrade user data:", userData);

    // Then, generate a connection portal URL
    let portalResponse;

    if (useProxy && typeof window !== "undefined") {
      // Use the CORS proxy for client-side requests
      const proxyResponse = await fetchWithRetry(
        "/api/snaptrade/connect/cors-proxy",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: `${SNAPTRADE_API_URL}/snapTrade/connectionPortal`,
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              "Client-ID": CLIENT_ID,
              "Consumer-Key": CONSUMER_KEY,
            },
            body: JSON.stringify({
              userId: userId,
              redirectURI: redirectUri,
              ...(brokerId && { brokerage: brokerId }),
            }),
          }),
        },
        3, // retries
        1000, // delay
      );

      let proxyData;
      let responseText;
      try {
        responseText = await proxyResponse.text();
        try {
          proxyData = JSON.parse(responseText);
        } catch (parseError) {
          console.error("Failed to parse proxy response as JSON:", parseError);
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
              `Received HTML response from SnapTrade API. The service might be down or experiencing issues. HTML preview: ${responseText.substring(0, 100)}...`,
            );
          } else {
            throw new Error(
              `Failed to parse response from SnapTrade API: ${parseError.message}. Raw response: ${responseText.substring(0, 100)}...`,
            );
          }
        }
      } catch (error) {
        if (error.message.includes("Received HTML response")) {
          throw error; // Re-throw our custom HTML error
        }
        console.error("Failed to read proxy response:", error);
        throw new Error(
          `Failed to read response from SnapTrade API: ${error.message}`,
        );
      }

      if (!proxyResponse.ok) {
        throw new Error(
          `Proxy error: ${proxyData.error || proxyResponse.statusText}`,
        );
      }

      // Check if there was an error in the proxy response
      if (proxyData.error || (proxyData.data && proxyData.data.error)) {
        throw new Error(
          `Proxy error: ${proxyData.error || proxyData.data.error || proxyResponse.statusText}`,
        );
      }

      // Create a mock Response object from the proxy data
      portalResponse = new Response(JSON.stringify(proxyData.data), {
        status: proxyData.status,
        statusText: proxyData.statusText,
        headers: new Headers(proxyData.headers),
      });
    } else {
      // Direct API call for server-side requests
      portalResponse = await fetchWithRetry(
        `${SNAPTRADE_API_URL}/snapTrade/connectionPortal`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "Client-ID": CLIENT_ID,
            "Consumer-Key": CONSUMER_KEY,
          },
          body: JSON.stringify({
            userId: userId,
            redirectURI: redirectUri,
            ...(brokerId && { brokerage: brokerId }),
          }),
        },
        3, // retries
        1000, // delay
      );
    }

    if (!portalResponse.ok) {
      const errorData = await portalResponse.json();
      console.error("SnapTrade portal generation error:", errorData);
      throw new Error(
        `Failed to generate SnapTrade portal: ${portalResponse.status}`,
      );
    }

    const portalData = await portalResponse.json();
    console.log("SnapTrade portal data:", portalData);

    if (!portalData.redirectURI) {
      throw new Error("No redirect URI returned from SnapTrade");
    }

    return portalData.redirectURI;
  } catch (error) {
    console.error("Error creating SnapTrade user link:", error);
    // Provide more detailed error message
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(
        `Network error connecting to SnapTrade API: ${error.message}`,
      );
    }
    throw error;
  }
}

/**
 * Handles the callback from SnapTrade after account connection
 * @param userId The user ID that was used for the connection
 * @param code The authorization code from the callback
 * @returns Connection details
 */
export async function handleSnapTradeCallback(userId: string, code: string) {
  if (!CLIENT_ID || !CONSUMER_KEY) {
    throw new Error("SnapTrade API credentials not configured");
  }

  try {
    // In a real implementation, you would exchange the code for account details
    // and save them to your database
    console.log(
      "Handling SnapTrade callback for user:",
      userId,
      "with code:",
      code,
    );

    // This is where you would make API calls to SnapTrade to get account details
    // For now, we'll just return a success message
    return {
      success: true,
      message: "Account connected successfully",
      accountId: "snaptrade-account-" + Date.now(), // Generate a unique ID
    };
  } catch (error) {
    console.error("Error handling SnapTrade callback:", error);
    throw error;
  }
}
