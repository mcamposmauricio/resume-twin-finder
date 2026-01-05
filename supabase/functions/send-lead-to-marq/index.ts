import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LeadPayload {
  userId: string;
  leadSource: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userId, leadSource } = (await req.json()) as LeadPayload;

    if (!userId) {
      console.error("Missing userId in request");
      return new Response(
        JSON.stringify({ error: "userId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing lead for user ${userId} with source: ${leadSource || "unknown"}`);

    // Fetch user profile data
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, name, company_name, employee_count, lead_source, created_at, phone")
      .eq("user_id", userId)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch profile" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update lead_source if provided and not already set
    if (leadSource && !profile.lead_source) {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ lead_source: leadSource })
        .eq("user_id", userId);

      if (updateError) {
        console.error("Error updating lead_source:", updateError);
      } else {
        console.log(`Updated lead_source to: ${leadSource}`);
      }
    }

    // Prepare lead data for MarQ API (format as specified)
    const leadData = {
      email: profile.email,
      created_at: profile.created_at,
      responsible_name: profile.name,
      company_name: profile.company_name,
      employees_count: profile.employee_count,
      phone: profile.phone,
      lead_source: leadSource || profile.lead_source || "comparecv",
      trigger_source: "compareCV",
      notes: "Solicitação de contato via CompareCV",
    };

    console.log("Sending lead data to MarQ API:", JSON.stringify(leadData));

    // Send to MarQ API
    const apiUrl = "https://marqponto-api-dev.azurewebsites.net/v1/internal/email";
    
    const apiResponse = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(leadData),
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error(`MarQ API failed with status ${apiResponse.status}: ${errorText}`);
      return new Response(
        JSON.stringify({ error: "Failed to send lead to MarQ", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Lead successfully sent to MarQ API");

    return new Response(
      JSON.stringify({ success: true, message: "Lead sent successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
