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

function validateCode(code: unknown) {
  if (typeof code !== "string" || !code.trim()) throw new Error("The AI response did not include code.");
  const cleanCode = code.trim().replace(/^```(?:tsx?|typescript|javascript|jsx)?\s*/i, "").replace(/\s*```$/, "");
  if (cleanCode.length > 100_000) throw new Error("The AI response was too large.");
  if (!/\bGeneratedUI\b|export\s+default/.test(cleanCode)) throw new Error("The AI response did not return a React component.");
  if (/<script|ReactDOM\.createRoot/i.test(cleanCode)) throw new Error("The AI response contains unsupported preview code.");
  return cleanCode;
}

async function requestGroq(messages: unknown[], failureMessage: string) {
  let lastError: Error | undefined;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${getApiKey()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: process.env.GROQ_MODEL || "qwen/qwen3.8-27b", messages, response_format: { type: "json_object" }, temperature: 0.2, max_completion_tokens: 6000 }),
      });
      const result = await response.json() as GroqResponse;
      if (!response.ok) {
        const message = result.error?.message || `Groq request failed with status ${response.status}.`;
        if ((response.status === 429 || response.status >= 500) && attempt < 2) { await delay(1000 * 2 ** attempt); continue; }
        throw new Error(message);
      }
      const content = result.choices?.[0]?.message?.content;
      if (!content) throw new Error("Groq did not return a response.");
      return JSON.parse(content) as unknown;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(failureMessage);
      if (attempt < 2 && /fetch|network|timeout/i.test(lastError.message)) { await delay(1000 * 2 ** attempt); continue; }
      throw lastError;
    }
  }
  throw lastError || new Error(failureMessage);
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
  ].join("\n\n");
  const result = await requestGroq([{ role: "user", content: [{ type: "text", text: instruction }, { type: "image_url", image_url: { url: `data:${file.mimetype};base64,${file.buffer.toString("base64")}` } }] }], "Failed to generate UI with Groq.") as GeneratedUI;
  return { ...result, code: validateCode(result?.code) };
}

export async function modifyReactUI(code: string, instruction: string) {
  const prompt = [
    "You are editing an existing React TypeScript component that uses Tailwind CSS.",
    "Return only valid JSON with this exact shape: {\"code\":\"string\"}.",
    "Apply only the user's requested change. Preserve all existing components, content, behavior, event handlers, and styling unless the request explicitly changes them.",
    "Keep the component self-contained. Do not add imports, ReactDOM calls, scripts, markdown fences, explanations, external assets, or package dependencies.",
    "Keep or return the component as `const GeneratedUI = ...`.",
    `Current code:\n${code}`,
    `Modification request: ${instruction}`,
  ].join("\n\n");
  const result = await requestGroq([{ role: "user", content: prompt }], "Failed to modify UI with Groq.") as { code?: unknown };
  return { code: validateCode(result?.code) };
}
