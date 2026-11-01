import express from "express";
import cors from "cors";
import "dotenv/config";
import { getDb } from "./db.js";
import { verifyToken } from "./middleware/verifyToken.js";
import booksRouter from "./routes/books.js";
import borrowsRouter from "./routes/borrows.js";

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

app.use("/books", booksRouter);
// Every borrow route needs a logged in user
app.use("/borrows", verifyToken, borrowsRouter);

// Any address we don't have
app.use((_req, res) => {
  res.status(404).json({ message: "Route not found." });
});

// Any unexpected error ends up here
app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: "Something went wrong on the server." });
});

if (!process.env.VERCEL) {
  const port = process.env.PORT || 5000;
  app.listen(port, () => console.log(`BookNook API running on port ${port}`));
}

export default app;
