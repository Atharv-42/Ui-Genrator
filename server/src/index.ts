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

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "PixelForge API is running",
  });
});

app.use("/api/projects", projectsRouter);
app.use("/api/generate", generateRouter);
app.use("/api/modify", modifyRouter);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


