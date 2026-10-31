import express from "express";
import cors from "cors";
import "dotenv/config";
import { getDb } from "./db.js";

const app = express();

// Middleware: runs on every request before our routes
app.use(cors());
app.use(express.json());

// Health check: also confirms the database is reachable
app.get("/", async (_req, res) => {
  try {
    const db = await getDb();
    await db.command({ ping: 1 });
    res.json({ ok: true, name: "BookNook API", database: "connected" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, message: "Database connection failed." });
  }
});

// Vercel runs the app itself, so we only listen when working locally
if (!process.env.VERCEL) {
  const port = process.env.PORT || 5000;
  app.listen(port, () => console.log(`BookNook API running on port ${port}`));
}

export default app;
