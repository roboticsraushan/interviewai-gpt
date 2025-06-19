import API_BASE_URL from "../config";

export async function submitTranscript(transcript) {
  const response = await fetch(`${API_BASE_URL}/onboarding/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transcript }),
  });

  if (!response.ok) {
    throw new Error("Failed to submit transcript");
  }

  return await response.json();
}
