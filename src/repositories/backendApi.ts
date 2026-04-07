import { apiFetch } from "@/lib/apiClient";

export type ScenarioMeta = {
  id: string;
  name: string;
  pinned: boolean;
  updatedAt?: string;
  createdAt?: string;
};

export async function apiListScenarios() {
  return await apiFetch<{ scenarios: ScenarioMeta[] }>("/scenarios");
}

export async function apiGetScenario(id: string) {
  return await apiFetch<{ scenario: any }>(`/scenarios/${encodeURIComponent(id)}`);
}

export async function apiUpsertScenario(input: { id: string; name: string; json: any; pinned?: boolean }, csrfToken: string | null) {
  return await apiFetch<{ scenario: ScenarioMeta }>("/scenarios", { method: "POST", body: input, csrfToken });
}

export async function apiUpdateScenario(id: string, input: { name?: string; json?: any; pinned?: boolean }, csrfToken: string | null) {
  return await apiFetch<{ scenario: ScenarioMeta }>(`/scenarios/${encodeURIComponent(id)}`, { method: "PUT", body: input, csrfToken });
}

export async function apiDeleteScenario(id: string, csrfToken: string | null) {
  return await apiFetch<{ ok: true }>(`/scenarios/${encodeURIComponent(id)}`, { method: "DELETE", csrfToken });
}

export async function apiUploadAsset(dataUrl: string, csrfToken: string | null) {
  return await apiFetch<{ asset: { id: string; mime: string; size: number }; url: string }>("/assets", {
    method: "POST",
    body: { dataUrl },
    csrfToken,
  });
}

