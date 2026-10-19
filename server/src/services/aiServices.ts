import type { Express } from "express";

export interface UIAnalysis {
  layout: string;
  components: string[];
  colors: string[];
  typography: string;
  spacing: string;
  responsiveBehavior: string;
}

export interface GeneratedUI {
  analysis: UIAnalysis;
  code: string;
}

interface GroqResponse {
  choices?: Array<{ message?: { content?: string | null } }>;
  error?: { message?: string };
}

const delay = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function getApiKey() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not configured on the server.");
  return apiKey;
}

export async function generateReactUI(file: Express.Multer.File, prompt: string): Promise<GeneratedUI> {
  const instruction = [
    "You are a senior frontend engineer. Analyze the supplied screenshot accurately.",
    "Return only valid JSON with this exact shape:",
    '{"analysis":{"layout":"string","components":["string"],"colors":["string"],"typography":"string","spacing":"string","responsiveBehavior":"string"},"code":"string"}.',
    "The code must be a self-contained React TypeScript component using Tailwind CSS utility classes.",
    "The preview supplies React and ReactDOM as browser globals, so do not add imports or exports.",
    "Define the component exactly as `const GeneratedUI = () => { return (/* JSX */); };`.",
    "Do not call ReactDOM.createRoot. Do not use markdown fences, external assets, package imports, or explanations inside code.",
    `User requirements: ${prompt}`,
  ].join("\\n\\n");

  const requestBody = {
    model: process.env.GROQ_MODEL || "qwen/qwen3.8-27b",
    messages: [{
      role: "user",
      content: [
        { type: "text", text: instruction },
        {
          type: "image_url",
          image_url: { url: `data:${file.mimetype};base64,${file.buffer.toString("base64")}` },
        },
      ],
    }],
    response_format: { type: "json_object" },
    temperature: 0.2,
    max_completion_tokens: 6000,
  };

  let lastError: Error | undefined;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getApiKey()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
      const result = await response.json() as GroqResponse;

      if (!response.ok) {
        const message = result.error?.message || `Groq request failed with status ${response.status}.`;
        if ((response.status === 429 || response.status >= 500) && attempt < 2) {
          await delay(1000 * 2 ** attempt);
          continue;
        }
        throw new Error(message);
      }

      const content = result.choices?.[0]?.message?.content;
      if (!content) throw new Error("Groq did not return generated UI content.");
      return JSON.parse(content) as GeneratedUI;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Failed to generate UI with Groq.");
      if (attempt < 2 && /fetch|network|timeout/i.test(lastError.message)) {
        await delay(1000 * 2 ** attempt);
        continue;
      }
      throw lastError;
    }
  }

  throw lastError || new Error("Failed to generate UI with Groq.");
}