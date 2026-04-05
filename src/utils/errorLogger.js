import { supabase } from "../lib/supabase";

export async function logFrontendError(error, context = {}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("activity_logs").insert({
      user_id: user?.id || null,
      action: "frontend_error",
      status: "error",
      severity: "WARN",
      details: {
        message: error.message,
        stack: error.stack?.substring(0, 500),
        url: window.location.href,
        userAgent: navigator.userAgent,
        ...context
      },
      ip_address: "client_side"
    });
  } catch (e) {
    console.error("Error logging failed:", e);
  }
}
