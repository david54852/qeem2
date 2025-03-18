// Debug SnapTrade API Edge Function
// This function helps diagnose issues with the SnapTrade API

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { endpoint, method, body } = await req.json();

    if (!endpoint) {
      throw new Error("endpoint parameter is required");
    }

    // Get Supabase credentials from environment variables
    const supabaseUrl =
      Deno.env.get("SUPABASE_URL") || Deno.env.get("NEXT_PUBLIC_SUPABASE_URL");
    const supabaseKey =
      Deno.env.get("SUPABASE_ANON_KEY") ||
      Deno.env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY");

    // Use hardcoded credentials for testing
    // In production, these would come from environment variables
    const clientId =
      Deno.env.get("NEXT_PUBLIC_SNAPTRADE_CLIENT_ID") || "test_client_id";
    const consumerKey =
      Deno.env.get("NEXT_PUBLIC_SNAPTRADE_CONSUMER_KEY") || "test_consumer_key";

    // Skip Supabase credential check for this debug function
    // We don't actually need to use Supabase in this function

    if (!clientId || !consumerKey) {
      return new Response(
        JSON.stringify({
          error:
            "SnapTrade credentials not configured in environment variables",
          clientIdPresent: !!clientId,
          consumerKeyPresent: !!consumerKey,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        },
      );
    }

    // Construct the full URL
    const baseUrl = "https://api.snaptrade.com/api/v1";
    const url = `${baseUrl}/${endpoint}`;

    console.log(`Making ${method || "GET"} request to: ${url}`);

    // Make the request to SnapTrade API
    const requestInit: RequestInit = {
      method: method || "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Client-ID": clientId,
        "Consumer-Key": consumerKey,
      },
    };

    // Add body if provided and method is not GET
    if (body && method && method.toUpperCase() !== "GET") {
      requestInit.body = JSON.stringify(body);
    }

    // Make the request with detailed error handling
    try {
      const response = await fetch(url, requestInit);
      const responseText = await response.text();

      // Try to parse as JSON
      let responseData;
      let isJson = false;

      try {
        responseData = JSON.parse(responseText);
        isJson = true;
      } catch (e) {
        // Not valid JSON
        responseData = { text: responseText };
      }

      // Return detailed response information
      return new Response(
        JSON.stringify({
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          isJson,
          data: responseData,
          rawText: responseText.substring(0, 1000), // First 1000 chars of raw response
          contentType: response.headers.get("content-type"),
          contentLength: responseText.length,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      );
    } catch (fetchError) {
      // Network or fetch error
      return new Response(
        JSON.stringify({
          error: `Fetch error: ${fetchError.message}`,
          stack: fetchError.stack,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        },
      );
    }
  } catch (error) {
    // General error handling
    return new Response(
      JSON.stringify({
        error: `Error in debug function: ${error.message}`,
        stack: error.stack,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
