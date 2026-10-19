export interface UIAnalysis {
  layout: string;
  colors: string[];
  typography: string;
  components: string[];
  spacing: string;
  responsiveBehavior: string;
}

export interface GenerateResponse {
  success: boolean;
  analysis: UIAnalysis;
  code: string;
  message?: string;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export async function generateUI(image: File, prompt: string): Promise<GenerateResponse> {
  const formData = new FormData();
  formData.append("image", image);
  formData.append("prompt", prompt);
  const response = await fetch(`${API_URL}/api/generate`, { method: "POST", body: formData });
  const result = await response.json().catch(() => null) as GenerateResponse | null;
  if (!response.ok || !result?.success) throw new Error(result?.message || "Failed to generate UI.");
  return result;
}
export interface ModifyResponse {
  success: boolean;
  code: string;
  message?: string;
}

export async function modifyUI(code: string, instruction: string): Promise<ModifyResponse> {
  const response = await fetch(`${API_URL}/api/modify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, instruction }),
  });
  const result = await response.json().catch(() => null) as ModifyResponse | null;
  if (!response.ok || !result?.success) throw new Error(result?.message || "Failed to modify UI.");
  return result;
}
