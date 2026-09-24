import { createClient } from "@supabase/supabase-js";

// Server-only client using the service_role key, which bypasses Row Level
// Security entirely. Never import this file from a Client Component — it must
// only be used inside API routes (src/app/api/**/route.ts).
//
// supabase-js issues its requests through the global fetch, which Next.js
// patches to cache GET requests by default — even in a route handler marked
// force-dynamic. Without this override, a query result (e.g. "no clients
// yet") can get cached and served stale forever after. Explicitly forcing
// no-store here makes every query hit the database, every time.
export function supabaseServer() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set — check .env.local");
  }
  return createClient(url, key, {
    auth: { persistSession: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });
}
