/**
 * Cliente de API do frontend.
 * Todas as chamadas vão para /api/* que é tratado pelo servidor
 * (middleware do Vite em dev, Vercel Functions em produção).
 * O SDK do Notion NUNCA roda no navegador.
 */

async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  })

  let data = null
  try {
    data = await res.json()
  } catch {
    data = null
  }

  if (!res.ok) {
    const message = data?.error || `Erro ${res.status}`
    const error = new Error(message)
    error.code = data?.code
    error.status = res.status
    throw error
  }
  return data
}

export const api = {
  health: () => request("/health"),

  listPatients: (search = "") =>
    request(`/patients${search ? `?search=${encodeURIComponent(search)}` : ""}`),

  getPatient: (id) => request(`/patients/${id}`),

  createPatient: (data) =>
    request("/patients", { method: "POST", body: JSON.stringify(data) }),

  listEvolutions: (patientId) =>
    request(`/evolutions?patientId=${encodeURIComponent(patientId)}`),

  createEvolution: (data) =>
    request("/evolutions", { method: "POST", body: JSON.stringify(data) }),
}
