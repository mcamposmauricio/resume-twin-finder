import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RDStationInput {
  conversion_identifier: string;
  email: string;
  name?: string;
  personal_phone?: string;
  company_name?: string;
  cf_resultado_personalizado?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  referrer?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: RDStationInput = await req.json();

    // Validate required fields
    if (!body.email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!body.conversion_identifier) {
      return new Response(
        JSON.stringify({ error: "conversion_identifier is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get RD Station API key from environment
    const rdStationApiKey = Deno.env.get("RD_STATION_API_KEY");
    if (!rdStationApiKey) {
      console.error("RD_STATION_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "RD Station API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build RD Station payload
    const rdPayload = {
      event_type: "CONVERSION",
      event_family: "CDP",
      payload: {
        conversion_identifier: body.conversion_identifier,
        email: body.email,
        name: body.name || undefined,
        personal_phone: body.personal_phone || undefined,
        company_name: body.company_name || undefined,
        available_for_mailing: true,
        traffic_source: "comparecv",
        // Custom fields for UTMs
        ...(body.cf_resultado_personalizado && { cf_resultado_personalizado: body.cf_resultado_personalizado }),
        ...(body.utm_source && { cf_utm_source: body.utm_source }),
        ...(body.utm_medium && { cf_utm_medium: body.utm_medium }),
        ...(body.utm_campaign && { cf_utm_campaign: body.utm_campaign }),
        ...(body.utm_content && { cf_utm_content: body.utm_content }),
        ...(body.utm_term && { cf_utm_term: body.utm_term }),
        ...(body.referrer && { cf_referrer: body.referrer }),
      },
    };

    // Remove undefined values from payload
    Object.keys(rdPayload.payload).forEach(key => {
      if (rdPayload.payload[key as keyof typeof rdPayload.payload] === undefined) {
        delete rdPayload.payload[key as keyof typeof rdPayload.payload];
      }
    });

    console.log("Sending to RD Station:", JSON.stringify(rdPayload, null, 2));

    // Send to RD Station API
    const rdResponse = await fetch(
      `https://api.rd.services/platform/conversions?api_key=${rdStationApiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(rdPayload),
      }
    );

    const responseText = await rdResponse.text();
    console.log("RD Station response:", rdResponse.status, responseText);

    if (!rdResponse.ok) {
      console.error("RD Station API error:", responseText);
      return new Response(
        JSON.stringify({ 
          error: "Failed to send to RD Station", 
          details: responseText,
          status: rdResponse.status 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Lead sent to RD Station" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in send-lead-to-rdstation:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
