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

/**
 * Aceita tanto um ID puro quanto uma URL completa do Notion e devolve o ID
 * de database/página normalizado no formato 8-4-4-4-12. Isso permite que o
 * usuário cole a URL da database diretamente na variável de ambiente.
 */
function normalizeId(value) {
  if (!value) return value
  const cleaned = String(value).trim()
  // remove query string e captura o último bloco de 32 caracteres hexadecimais
  const match = cleaned.replace(/[?#].*$/, "").match(/([0-9a-fA-F]{32})(?!.*[0-9a-fA-F]{32})/)
  const hex = match ? match[1] : cleaned.replace(/-/g, "")
  if (/^[0-9a-fA-F]{32}$/.test(hex)) {
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
  }
  return cleaned
}

function getConfig() {
  return {
    token: process.env.NOTION_TOKEN?.trim(),
    patientsDb: normalizeId(process.env.NOTION_PATIENTS_DB_ID),
    historyDb: normalizeId(process.env.NOTION_HISTORY_DB_ID),
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
  const { token, patientsDb } = getConfig()
  // basta o token e ao menos uma referência (página ou database) para começar
  return Boolean(token && patientsDb)
}

/* ---------------- Schemas das databases ---------------- */

const PATIENTS_TITLE = "Pacientes"
const HISTORY_TITLE = "Evoluções Clínicas"

const PATIENTS_SCHEMA = {
  Nome: { title: {} },
  Idade: { number: {} },
  Sexo: { select: { options: [{ name: "Feminino" }, { name: "Masculino" }, { name: "Outro" }] } },
  Telefone: { phone_number: {} },
  Prontuario: { rich_text: {} },
  DataNascimento: { date: {} },
  QueixaPrincipal: { rich_text: {} },
}

const HISTORY_SCHEMA = {
  Resumo: { title: {} },
  PacienteID: { rich_text: {} },
  Data: { date: {} },
  Tipo: {
    select: {
      options: [
        { name: "Consulta" },
        { name: "Evolução" },
        { name: "Anamnese" },
        { name: "Exame" },
        { name: "Procedimento" },
        { name: "Alta" },
      ],
    },
  },
  Subjetivo: { rich_text: {} },
  Objetivo: { rich_text: {} },
  Avaliacao: { rich_text: {} },
  Plano: { rich_text: {} },
}

/* ---------------- Resolução / auto-provisionamento ---------------- */

// cache em memória dos IDs de database já resolvidos
const resolvedIds = { patients: null, history: null }
let rootPageId = null

async function isDatabase(notion, id) {
  try {
    await notion.databases.retrieve({ database_id: id })
    return true
  } catch {
    return false
  }
}

async function isAccessiblePage(notion, id) {
  try {
    await notion.pages.retrieve({ page_id: id })
    return true
  } catch {
    return false
  }
}

// procura uma child_database com determinado título dentro de uma página
async function findChildDatabase(notion, pageId, title) {
  let cursor
  do {
    const res = await notion.blocks.children.list({
      block_id: pageId,
      start_cursor: cursor,
      page_size: 100,
    })
    for (const block of res.results) {
      if (block.type === "child_database" && block.child_database?.title === title) {
        return block.id
      }
    }
    cursor = res.has_more ? res.next_cursor : undefined
  } while (cursor)
  return null
}

async function createDatabase(notion, pageId, title, schema) {
  const db = await notion.databases.create({
    parent: { type: "page_id", page_id: pageId },
    title: [{ type: "text", text: { content: title } }],
    properties: schema,
  })
  return db.id
}

// descobre uma página acessível para hospedar as databases criadas automaticamente
async function getRootPage(notion) {
  if (rootPageId) return rootPageId
  const { patientsDb, historyDb } = getConfig()
  for (const candidate of [patientsDb, historyDb]) {
    if (candidate && (await isAccessiblePage(notion, candidate))) {
      rootPageId = candidate
      return rootPageId
    }
  }
  const err = new Error(
    "Nenhuma página acessível encontrada. Compartilhe a página do Notion com a integração e use a URL dessa página em NOTION_PATIENTS_DB_ID.",
  )
  err.code = "NO_ROOT_PAGE"
  throw err
}

/**
 * Resolve o ID real de uma database. Se a variável de ambiente já aponta para
 * uma database, usa-a. Caso contrário, procura (ou cria) a database dentro de
 * uma página acessível do Notion. Resultado é cacheado.
 */
async function resolveDb(kind) {
  if (resolvedIds[kind]) return resolvedIds[kind]

  const notion = getClient()
  const { patientsDb, historyDb } = getConfig()
  const configured = kind === "patients" ? patientsDb : historyDb
  const title = kind === "patients" ? PATIENTS_TITLE : HISTORY_TITLE
  const schema = kind === "patients" ? PATIENTS_SCHEMA : HISTORY_SCHEMA

  // 1. já é uma database válida?
  if (configured && (await isDatabase(notion, configured))) {
    resolvedIds[kind] = configured
    return configured
  }

  // 2. resolve dentro de uma página acessível (encontra ou cria)
  const root = await getRootPage(notion)
  const existing = await findChildDatabase(notion, root, title)
  resolvedIds[kind] = existing || (await createDatabase(notion, root, title, schema))
  return resolvedIds[kind]
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
  const patientsDb = await resolveDb("patients")

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
  const patientsDb = await resolveDb("patients")

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
  const historyDb = await resolveDb("history")

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
  const historyDb = await resolveDb("history")

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
