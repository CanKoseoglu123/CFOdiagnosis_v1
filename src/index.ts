import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(cors());
app.use(express.json());

// ------------------------------------------------------------------
// Supabase client
// ------------------------------------------------------------------
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ------------------------------------------------------------------
// Routes
// ------------------------------------------------------------------
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

/**
 * Supabase health check
 * Uses auth.getUser() which always exists and requires no tables
 */
app.get("/supabase-health", async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      return res.status(500).json({
        status: "supabase-error",
        error: error.message,
      });
    }

    res.json({
      status: "supabase-ok",
      authenticated: !!data.user,
    });
  } catch (err) {
    res.status(500).json({
      status: "supabase-failed",
      error: String(err),
    });
  }
});

// ------------------------------------------------------------------
// Server
// ------------------------------------------------------------------
const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
