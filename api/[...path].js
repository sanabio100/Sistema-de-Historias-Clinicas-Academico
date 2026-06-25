import { handleApi } from "../server/notion.js"

/**
 * Catch-all das rotas /api/* em produção (Vercel Functions).
 * Reutiliza o mesmo dispatcher usado pelo middleware do Vite em dev.
 */
export default async function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`)
  const query = Object.fromEntries(url.searchParams.entries())

  let body = req.body
  if (typeof body === "string") {
    try {
      body = JSON.parse(body)
    } catch {
      body = {}
    }
  }

  const result = await handleApi({
    method: req.method,
    pathname: url.pathname,
    query,
    body: body || {},
  })

  res.status(result.status).json(result.body)
}
