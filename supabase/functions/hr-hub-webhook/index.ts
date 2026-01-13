import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WebhookPayload {
  user_id: string;
  email: string;
  event_type: "user.created" | "user.updated";
  name: string;
  company_name: string;
  number_of_employees: string | number;
  phone?: string;
  password_hash?: string;
  permissions?: string[];
  source?: string;
  created_at: string;
  updated_at: string;
  tool_id: string;
  tool_name: string;
  timestamp: string;
  cargo?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authorization
    const authHeader = req.headers.get("Authorization");
    const webhookSecret = Deno.env.get("HR_HUB_WEBHOOK_SECRET");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Authorization header required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    if (token !== webhookSecret) {
      return new Response(
        JSON.stringify({ error: "Invalid authorization token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload: WebhookPayload = await req.json();

    // Validate required fields
    if (!payload.user_id || !payload.email || !payload.event_type) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: user_id, email, event_type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate password_hash format if provided
    if (payload.password_hash) {
      if (!payload.password_hash.startsWith("$2a$") && !payload.password_hash.startsWith("$2b$")) {
        return new Response(
          JSON.stringify({ error: "Invalid password_hash format: must start with $2a$ or $2b$" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (payload.password_hash.length !== 60) {
        return new Response(
          JSON.stringify({ error: "Invalid password_hash format: must be exactly 60 characters" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const employeeCount = typeof payload.number_of_employees === "number" 
      ? payload.number_of_employees.toString() 
      : payload.number_of_employees;

    if (payload.event_type === "user.created") {
      // Check if user already exists
      const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
      const userExists = existingUser?.users?.find(u => u.email === payload.email);

      if (userExists) {
        // Update existing user's profile
        const { error: updateError } = await supabaseAdmin
          .from("profiles")
          .update({
            name: payload.name,
            company_name: payload.company_name,
            employee_count: employeeCount,
            phone: payload.phone,
            source: "hr_hub",
            hr_hub_user_id: payload.user_id,
            cargo: payload.cargo,
          })
          .eq("user_id", userExists.id);

        if (updateError) {
          console.error("Error updating profile:", updateError);
          return new Response(
            JSON.stringify({ error: "Failed to update profile", details: updateError.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Update password hash if provided
        if (payload.password_hash) {
          const { error: pwError } = await supabaseAdmin.rpc("update_user_password_hash", {
            p_user_id: userExists.id,
            p_password_hash: payload.password_hash,
          });
          if (pwError) {
            console.error("Error updating password hash:", pwError);
          }
        }

        return new Response(
          JSON.stringify({ success: true, message: "User updated", user_id: userExists.id }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create new user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: payload.email,
        email_confirm: true,
        user_metadata: {
          name: payload.name,
          company_name: payload.company_name,
          employee_count: employeeCount,
          phone: payload.phone,
          source: "hr_hub",
          hr_hub_user_id: payload.user_id,
          cargo: payload.cargo,
        },
      });

      if (createError) {
        console.error("Error creating user:", createError);
        return new Response(
          JSON.stringify({ error: "Failed to create user", details: createError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update password hash if provided
      if (payload.password_hash && newUser?.user) {
        const { error: pwError } = await supabaseAdmin.rpc("update_user_password_hash", {
          p_user_id: newUser.user.id,
          p_password_hash: payload.password_hash,
        });
        if (pwError) {
          console.error("Error updating password hash:", pwError);
        }
      }

      return new Response(
        JSON.stringify({ success: true, message: "User created", user_id: newUser?.user?.id }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else if (payload.event_type === "user.updated") {
      // Find user by email
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === payload.email);

      if (!existingUser) {
        return new Response(
          JSON.stringify({ error: "User not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update profile
      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({
          name: payload.name,
          company_name: payload.company_name,
          employee_count: employeeCount,
          phone: payload.phone,
          cargo: payload.cargo,
        })
        .eq("user_id", existingUser.id);

      if (updateError) {
        console.error("Error updating profile:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to update profile", details: updateError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update password hash if provided
      if (payload.password_hash) {
        const { error: pwError } = await supabaseAdmin.rpc("update_user_password_hash", {
          p_user_id: existingUser.id,
          p_password_hash: payload.password_hash,
        });
        if (pwError) {
          console.error("Error updating password hash:", pwError);
        }
      }

      return new Response(
        JSON.stringify({ success: true, message: "User updated", user_id: existingUser.id }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid event_type" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Webhook error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Internal server error", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
