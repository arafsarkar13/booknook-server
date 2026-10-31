import express from "express";
import cors from "cors";
import "dotenv/config";

const app = express();

// Middleware: runs on every request before our routes
app.use(cors());
app.use(express.json());

// A simple test route
app.get("/", (_req, res) => {
  res.json({ ok: true, name: "BookNook API" });
});

// Vercel runs the app itself, so we only listen when working locally
if (!process.env.VERCEL) {
  const port = process.env.PORT || 5000;
  app.listen(port, () => console.log(`BookNook API running on port ${port}`));
}

export default app;
