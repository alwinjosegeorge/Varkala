import { createFileRoute } from "@tanstack/react-router";
import { initDb, getState, saveState } from "../lib/db";

export const Route = createFileRoute("/api/sync")({
  server: {
    handlers: {
      GET: async () => {
        try {
          await initDb();
          const state = await getState();
          return new Response(JSON.stringify({ success: true, state }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (err: any) {
          return new Response(JSON.stringify({ success: false, error: err.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
      POST: async ({ request }) => {
        try {
          await initDb();
          const body = await request.json();
          const success = await saveState(body);
          return new Response(JSON.stringify({ success }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (err: any) {
          return new Response(JSON.stringify({ success: false, error: err.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
