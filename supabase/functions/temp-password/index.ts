import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, email, user_id, original_hash } = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    if (action === "set") {
      if (!email) {
        return new Response(JSON.stringify({ error: "email is required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Find user by email
      const { data: users } = await supabaseAdmin.auth.admin.listUsers();
      const user = users?.users?.find(u => u.email === email);
      if (!user) {
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get current password hash
      const { data: hash, error: hashErr } = await supabaseAdmin.rpc("get_user_password_hash", {
        p_user_id: user.id,
      });

      if (hashErr) {
        return new Response(JSON.stringify({ error: "Failed to get hash", details: hashErr.message }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Set temporary password
      const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        password: "123123",
      });

      if (updateErr) {
        return new Response(JSON.stringify({ error: "Failed to set temp password", details: updateErr.message }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        user_id: user.id,
        original_hash: hash,
        temp_password: "123123",
        message: "Temporary password set. SAVE the original_hash to restore later.",
      }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (action === "restore") {
      if (!user_id || !original_hash) {
        return new Response(JSON.stringify({ error: "user_id and original_hash are required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: restoreErr } = await supabaseAdmin.rpc("update_user_password_hash", {
        p_user_id: user_id,
        p_password_hash: original_hash,
      });

      if (restoreErr) {
        return new Response(JSON.stringify({ error: "Failed to restore hash", details: restoreErr.message }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        message: "Original password restored successfully.",
      }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else {
      return new Response(JSON.stringify({ error: "Invalid action. Use 'set' or 'restore'." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: "Internal error", details: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
