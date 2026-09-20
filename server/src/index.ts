import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import generateRouter from "./routes/generate";

dotenv.config();

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

app.use("/api/generate", generateRouter);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});