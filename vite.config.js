import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"

/**
 * Plugin que expõe a API do Notion durante o `vite dev`.
 * Em produção (Vercel) as mesmas rotas são servidas por /api/[...path].js.
 */
function notionApiPlugin(env) {
  // disponibiliza as variáveis no process.env para o código do servidor
  for (const key of ["NOTION_TOKEN", "NOTION_PATIENTS_DB_ID", "NOTION_HISTORY_DB_ID"]) {
    if (env[key] && !process.env[key]) process.env[key] = env[key]
  }

  return {
    name: "notion-api-middleware",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith("/api/")) return next()

        const url = new URL(req.url, "http://localhost")
        const query = Object.fromEntries(url.searchParams.entries())

        let body = {}
        if (req.method === "POST" || req.method === "PUT") {
          body = await readBody(req)
        }

        // import dinâmico para sempre pegar a versão mais recente em dev
        const { handleApi } = await server.ssrLoadModule("/server/notion.js")
        const result = await handleApi({
          method: req.method,
          pathname: url.pathname,
          query,
          body,
        })

        res.statusCode = result.status
        res.setHeader("Content-Type", "application/json")
        res.end(JSON.stringify(result.body))
      })
    },
  }
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = ""
    req.on("data", (chunk) => {
      data += chunk
    })
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {})
      } catch {
        resolve({})
      }
    })
    req.on("error", () => resolve({}))
  })
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  return {
    plugins: [react(), notionApiPlugin(env)],
  }
})
