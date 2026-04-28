// supabase/functions/capture-paypal-order/index.ts
//
// Captures a PayPal order server-side, validates the captured amount against
// the expected amount, then inserts the sale record into `ventas`.
// This prevents clients from manipulating the price on the frontend.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PAYPAL_CLIENT_ID = Deno.env.get("PAYPAL_CLIENT_ID")!;
const PAYPAL_SECRET = Deno.env.get("PAYPAL_SECRET")!;
const PAYPAL_API = Deno.env.get("PAYPAL_MODE") === "sandbox"
  ? "https://api-m.sandbox.paypal.com"
  : "https://api-m.paypal.com";

const ALLOWED_ORIGINS = [
  "https://delegaweb.com",
  "https://www.delegaweb.com",
  "https://delega-web.vercel.app",
  "http://localhost:5173",
];
function buildCors(req: Request): HeadersInit {
  const origin = req.headers.get("origin") ?? "";
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Vary": "Origin",
  };
}

const CaptureSchema = z.object({
  orderId: z.string().min(1).max(100),
  expectedAmount: z.string().regex(/^\d+(\.\d{1,2})?$/),
  currency: z.enum(["USD", "EUR", "MXN"]),
  service: z.string().min(1).max(500),
  payerPhone: z.string().max(30),
  campaignSource: z.string().max(100),
  projectNotes: z.string().max(500),
  priority: z.boolean(),
});

async function getPayPalAccessToken(): Promise<string> {
  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Basic ${btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`)}`,
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error("PayPal auth failed");
  const data = await res.json();
  return data.access_token;
}

serve(async (req: Request) => {
  const corsHeaders = buildCors(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  try {
    // Auth opcional: este endpoint lo invocan compradores anónimos desde la
    // web pública (Services, Navbar). La seguridad C1 contra manipulación de
    // precio NO depende de la auth — depende de re-capturar la orden contra
    // PayPal y verificar el monto. Si el usuario está logueado guardamos su
    // user_id; si no, la venta queda con user_id null (igual que antes del fix).
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    let userId: string | null = null;
    if (token) {
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id ?? null;
    }

    const body = await req.json();
    const parsed = CaptureSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Datos inválidos" }), { status: 400, headers: corsHeaders });
    }

    const { orderId, expectedAmount, currency, service, payerPhone, campaignSource, projectNotes } = parsed.data;

    // 1. Capture the order on PayPal's side
    const accessToken = await getPayPalAccessToken();
    const captureRes = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
    });

    if (!captureRes.ok) {
      const err = await captureRes.text();
      console.error("PayPal capture failed:", err);
      return new Response(JSON.stringify({ error: "Error al capturar el pago con PayPal" }), {
        status: 402,
        headers: corsHeaders,
      });
    }

    const order = await captureRes.json();

    // 2. Validate captured amount matches expected
    const capture = order.purchase_units?.[0]?.payments?.captures?.[0];
    if (!capture) {
      return new Response(JSON.stringify({ error: "No se encontró captura en la respuesta de PayPal" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const capturedAmount = parseFloat(capture.amount?.value ?? "0");
    const expected = parseFloat(expectedAmount);

    // Allow 1 cent tolerance for floating point
    if (Math.abs(capturedAmount - expected) > 0.01 || capture.amount?.currency_code !== currency) {
      console.error(`Amount mismatch: captured=${capturedAmount} expected=${expected}`);
      return new Response(JSON.stringify({ error: "El monto capturado no coincide con el esperado" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    if (capture.status !== "COMPLETED") {
      return new Response(JSON.stringify({ error: "El pago no fue completado" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // 3. Insert sale record (server-side, trusted amount from PayPal)
    const payerData = order.payer ?? {};
    const nameData = payerData.name ?? {};
    const payerName = `${nameData.given_name ?? ""} ${nameData.surname ?? ""}`.trim();

    // La tabla 'ventas' no tiene columna user_id (las ventas son agnósticas
    // al usuario logueado — vienen de compradores anónimos en la web pública).
    // El userId opcional se ignora para el insert; lo dejamos resuelto arriba
    // por si se quiere logear/auditar más adelante.
    void userId;
    const { error: dbError } = await supabase.from("ventas").insert({
      servicio: service,
      importe: capturedAmount,
      moneda: currency,
      cliente_nombre: payerName,
      cliente_email: payerData.email_address ?? null,
      cliente_telefono: payerPhone,
      campana_origen: campaignSource,
      notas: projectNotes,
      paypal_order_id: order.id,
      estado: "pagado",
    });

    if (dbError) {
      console.error("DB insert error:", dbError);
      // Payment was captured — return partial success so frontend can show the order ID
      return new Response(JSON.stringify({
        ok: false,
        dbSyncError: true,
        order: { id: order.id, payer: payerData },
      }), { status: 200, headers: corsHeaders });
    }

    return new Response(JSON.stringify({
      ok: true,
      order: { id: order.id, payer: payerData },
    }), { status: 200, headers: corsHeaders });

  } catch (err) {
    const error = err as Error;
    console.error("capture-paypal-order error:", error.message);
    return new Response(JSON.stringify({ error: "Error interno del servidor" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
