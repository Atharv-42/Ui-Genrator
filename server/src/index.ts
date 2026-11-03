import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

import generateRouter from "./routes/generate";
import projectsRouter from "./routes/projects";
import modifyRouter from "./routes/modify";

dotenv.config({
  path: fileURLToPath(new URL("../.env", import.meta.url)),
});

const app = express();
const allowedOrigins = new Set([
  "http://localhost:5173",
  ...(process.env.CLIENT_ORIGINS || "").split(",").map((origin) => origin.trim()).filter(Boolean),
]);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) return callback(null, true);
      return callback(new Error("This origin is not allowed by the API CORS policy."));
    },
  })
);

app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "PixelForge API is running",
  });
});

app.use("/api/projects", projectsRouter);
app.use("/api/generate", generateRouter);
app.use("/api/modify", modifyRouter);

if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;


