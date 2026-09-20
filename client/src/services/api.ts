export interface UIAnalysis {
  layout: string;
  colors: string[];
  typography: string;
  components: string[];
}

export interface GenerateResponse {
  success: boolean;
  analysis: UIAnalysis;
  code: string;
  message?: string;
}

export async function generateUI(
  image: File,
  prompt: string
): Promise<GenerateResponse> {
  const formData = new FormData();

  formData.append("image", image);
  formData.append("prompt", prompt);

  const response = await fetch(
    "http://localhost:5000/api/generate",
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error("Failed to generate UI");
  }

  return response.json();
}