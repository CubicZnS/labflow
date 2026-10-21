export type HealthResponse = {
  status: string;
  service: string;
  version: string;
};

export async function fetchHealth(signal?: AbortSignal): Promise<HealthResponse> {
  const response = await fetch("/api/health", { signal });
  if (!response.ok) {
    throw new Error("API health request failed with status " + response.status);
  }
  return (await response.json()) as HealthResponse;
}