import { Router } from "express";
import multer from "multer";

import { generateReactUI } from "../services/aiServices";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

router.post(
  "/",
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Screenshot is required",
        });
      }

      const prompt =
        req.body.prompt ||
        "Recreate this UI using React and Tailwind CSS.";

      const result = await generateReactUI(
        req.file,
        prompt
      );

      return res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        success: false,
        message: "Failed to generate UI",
      });
    }
  }
);

export default router;
