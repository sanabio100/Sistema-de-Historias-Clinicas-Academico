import { Client } from "@notionhq/client"

/**
 * Camada de acesso ao Notion.
 *
 * Esta camada roda SEMPRE no servidor (middleware do Vite em dev e Vercel
 * Functions em produção). O token nunca é exposto ao navegador.
 *
 * Variáveis de ambiente esperadas:
 *  - NOTION_TOKEN              -> Integration token (secret_...)
 *  - NOTION_PATIENTS_DB_ID     -> ID da database de Pacientes
 *  - NOTION_HISTORY_DB_ID      -> ID da database de Evoluções clínicas
 *
 * Esquema esperado das databases (nomes das propriedades):
 *
 *  Pacientes:
 *    - Nome            (Title)
 *    - Idade           (Number)
 *    - Sexo            (Select)
 *    - Telefone        (Phone)
 *    - Prontuario      (Text)
 *    - DataNascimento  (Date)
 *    - QueixaPrincipal (Text)
 *
 *  Evolucoes:
 *    - Resumo     (Title)
 *    - PacienteID (Text)  -> guarda o id da página do paciente
 *    - Data       (Date)
 *    - Tipo       (Select)
 *    - Subjetivo  (Text)
 *    - Objetivo   (Text)
 *    - Avaliacao  (Text)
 *    - Plano      (Text)
 */

let cachedClient = null

function getConfig() {
  return {
    token: process.env.NOTION_TOKEN,
    patientsDb: process.env.NOTION_PATIENTS_DB_ID,
    historyDb: process.env.NOTION_HISTORY_DB_ID,
  }
}

function getClient() {
  const { token } = getConfig()
  if (!token) {
    const err = new Error(
      "Notion não configurado. Defina NOTION_TOKEN, NOTION_PATIENTS_DB_ID e NOTION_HISTORY_DB_ID nas variáveis de ambiente.",
    )
    err.code = "NOT_CONFIGURED"
    throw err
  }
  if (!cachedClient) {
    cachedClient = new Client({ auth: token })
  }
  return cachedClient
}

export function isConfigured() {
  const { token, patientsDb, historyDb } = getConfig()
  return Boolean(token && patientsDb && historyDb)
}

/* ---------------- Helpers de leitura de propriedades ---------------- */

function readTitle(prop) {
  if (!prop || prop.type !== "title") return ""
  return prop.title.map((t) => t.plain_text).join("")
}

function readText(prop) {
  if (!prop || prop.type !== "rich_text") return ""
  return prop.rich_text.map((t) => t.plain_text).join("")
}

function readNumber(prop) {
  if (!prop || prop.type !== "number") return null
  return prop.number
}

function readSelect(prop) {
  if (!prop || prop.type !== "select") return ""
  return prop.select?.name ?? ""
}

function readPhone(prop) {
  if (!prop) return ""
  if (prop.type === "phone_number") return prop.phone_number ?? ""
  if (prop.type === "rich_text") return readText(prop)
  return ""
}

function readDate(prop) {
  if (!prop || prop.type !== "date") return ""
  return prop.date?.start ?? ""
}

/* ---------------- Helpers de escrita de propriedades ---------------- */

const asTitle = (value) => ({ title: [{ text: { content: value ?? "" } }] })
const asText = (value) => ({ rich_text: value ? [{ text: { content: String(value) } }] : [] })
const asNumber = (value) => ({ number: value === "" || value == null ? null : Number(value) })
const asSelect = (value) => ({ select: value ? { name: value } : null })
const asPhone = (value) => ({ phone_number: value || null })
const asDate = (value) => ({ date: value ? { start: value } : null })

/* ---------------- Mapeamento de páginas ---------------- */

function mapPatient(page) {
  const p = page.properties
  return {
    id: page.id,
    nome: readTitle(p.Nome),
    idade: readNumber(p.Idade),
    sexo: readSelect(p.Sexo),
    telefone: readPhone(p.Telefone),
    prontuario: readText(p.Prontuario),
    dataNascimento: readDate(p.DataNascimento),
    queixaPrincipal: readText(p.QueixaPrincipal),
    criadoEm: page.created_time,
  }
}

function mapEvolution(page) {
  const p = page.properties
  return {
    id: page.id,
    resumo: readTitle(p.Resumo),
    pacienteId: readText(p.PacienteID),
    data: readDate(p.Data) || page.created_time,
    tipo: readSelect(p.Tipo),
    subjetivo: readText(p.Subjetivo),
    objetivo: readText(p.Objetivo),
    avaliacao: readText(p.Avaliacao),
    plano: readText(p.Plano),
    criadoEm: page.created_time,
  }
}

/* ---------------- Operações ---------------- */

export async function listPatients(search = "") {
  const notion = getClient()
  const { patientsDb } = getConfig()

  const query = {
    database_id: patientsDb,
    page_size: 100,
    sorts: [{ timestamp: "created_time", direction: "descending" }],
  }

  if (search && search.trim()) {
    query.filter = {
      property: "Nome",
      title: { contains: search.trim() },
    }
  }

  const res = await notion.databases.query(query)
  return res.results.map(mapPatient)
}

export async function getPatient(id) {
  const notion = getClient()
  const page = await notion.pages.retrieve({ page_id: id })
  return mapPatient(page)
}

export async function createPatient(data) {
  const notion = getClient()
  const { patientsDb } = getConfig()

  const page = await notion.pages.create({
    parent: { database_id: patientsDb },
    properties: {
      Nome: asTitle(data.nome),
      Idade: asNumber(data.idade),
      Sexo: asSelect(data.sexo),
      Telefone: asPhone(data.telefone),
      Prontuario: asText(data.prontuario),
      DataNascimento: asDate(data.dataNascimento),
      QueixaPrincipal: asText(data.queixaPrincipal),
    },
  })
  return mapPatient(page)
}

export async function listEvolutions(patientId) {
  const notion = getClient()
  const { historyDb } = getConfig()

  const res = await notion.databases.query({
    database_id: historyDb,
    filter: {
      property: "PacienteID",
      rich_text: { equals: patientId },
    },
    sorts: [{ property: "Data", direction: "descending" }],
    page_size: 100,
  })
  return res.results.map(mapEvolution)
}

export async function createEvolution(data) {
  const notion = getClient()
  const { historyDb } = getConfig()

  const page = await notion.pages.create({
    parent: { database_id: historyDb },
    properties: {
      Resumo: asTitle(data.resumo),
      PacienteID: asText(data.pacienteId),
      Data: asDate(data.data),
      Tipo: asSelect(data.tipo),
      Subjetivo: asText(data.subjetivo),
      Objetivo: asText(data.objetivo),
      Avaliacao: asText(data.avaliacao),
      Plano: asText(data.plano),
    },
  })
  return mapEvolution(page)
}

/* ---------------- Dispatcher REST compartilhado ---------------- */

/**
 * Roteador único usado tanto pelo middleware do Vite (dev) quanto pelas
 * Vercel Functions (produção). Recebe método/caminho/query/body e retorna
 * { status, body }.
 */
export async function handleApi({ method, pathname, query, body }) {
  try {
    // normaliza removendo prefixo /api
    const path = pathname.replace(/^\/api/, "").replace(/\/$/, "") || "/"

    // GET /api/health
    if (path === "/health" && method === "GET") {
      return { status: 200, body: { ok: true, configured: isConfigured() } }
    }

    // /api/patients
    if (path === "/patients") {
      if (method === "GET") {
        const patients = await listPatients(query.search || "")
        return { status: 200, body: { patients } }
      }
      if (method === "POST") {
        const patient = await createPatient(body || {})
        return { status: 201, body: { patient } }
      }
    }

    // /api/patients/:id
    const patientMatch = path.match(/^\/patients\/([^/]+)$/)
    if (patientMatch && method === "GET") {
      const patient = await getPatient(patientMatch[1])
      return { status: 200, body: { patient } }
    }

    // /api/evolutions
    if (path === "/evolutions") {
      if (method === "GET") {
        if (!query.patientId) {
          return { status: 400, body: { error: "patientId é obrigatório" } }
        }
        const evolutions = await listEvolutions(query.patientId)
        return { status: 200, body: { evolutions } }
      }
      if (method === "POST") {
        const evolution = await createEvolution(body || {})
        return { status: 201, body: { evolution } }
      }
    }

    return { status: 404, body: { error: "Rota não encontrada" } }
  } catch (err) {
    console.log("[v0] Erro na API Notion:", err.message)
    const status = err.code === "NOT_CONFIGURED" ? 503 : err.status || 500
    return {
      status,
      body: { error: err.message || "Erro interno", code: err.code },
    }
  }
}
