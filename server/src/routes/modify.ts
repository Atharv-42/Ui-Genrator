import { Router } from "express";
import { modifyReactUI } from "../services/aiServices";

const router = Router();
const MAX_CODE_LENGTH = 100_000;
const MAX_INSTRUCTION_LENGTH = 2_000;

router.post("/", async (req, res) => {
  const code = typeof req.body?.code === "string" ? req.body.code.trim() : "";
  const instruction = typeof req.body?.instruction === "string" ? req.body.instruction.trim() : "";
  if (!code) return res.status(400).json({ success: false, message: "Current UI code is required." });
  if (!instruction) return res.status(400).json({ success: false, message: "A modification request is required." });
  if (code.length > MAX_CODE_LENGTH || instruction.length > MAX_INSTRUCTION_LENGTH) return res.status(400).json({ success: false, message: "The modification request is too large." });
  try {
    const result = await modifyReactUI(code, instruction);
    return res.json({ success: true, ...result });
  } catch (error) {
    console.error("UI modification failed:", error);
    const message = error instanceof Error ? error.message : "Failed to modify UI.";
    return res.status(message.includes("GROQ_API_KEY") ? 503 : 500).json({ success: false, message });
  }
});

export default router;
