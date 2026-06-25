import { useState } from "react"
import { Loader2, Save } from "lucide-react"
import { Field, Input, Select, Textarea } from "./ui/Field"
import { api } from "../lib/api"
import { todayISO } from "../lib/format"

const TIPOS = ["Consulta", "Evolução", "Anamnese", "Exame", "Procedimento", "Alta"]

export function EvolutionForm({ patient, onCreated, onCancel }) {
  const [form, setForm] = useState({
    resumo: "",
    data: todayISO(),
    tipo: "Evolução",
    subjetivo: "",
    objetivo: "",
    avaliacao: "",
    plano: "",
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.resumo.trim()) {
      setError("Informe um título/resumo para a evolução.")
      return
    }
    setSaving(true)
    setError(null)
    try {
      const { evolution } = await api.createEvolution({
        ...form,
        pacienteId: patient.id,
      })
      onCreated(evolution)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Título / resumo" htmlFor="resumo" required className="sm:col-span-2">
          <Input id="resumo" value={form.resumo} onChange={update("resumo")} placeholder="Ex.: Retorno - controle de PA" />
        </Field>
        <Field label="Data" htmlFor="data">
          <Input id="data" type="date" value={form.data} onChange={update("data")} />
        </Field>
      </div>

      <Field label="Tipo de registro" htmlFor="tipo">
        <Select id="tipo" value={form.tipo} onChange={update("tipo")}>
          {TIPOS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
      </Field>

      <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Registro clínico (SOAP)
        </p>
        <div className="space-y-4">
          <Field label="S — Subjetivo" htmlFor="subjetivo">
            <Textarea
              id="subjetivo"
              rows={2}
              value={form.subjetivo}
              onChange={update("subjetivo")}
              placeholder="Relato do paciente, sintomas, história da doença atual"
            />
          </Field>
          <Field label="O — Objetivo" htmlFor="objetivo">
            <Textarea
              id="objetivo"
              rows={2}
              value={form.objetivo}
              onChange={update("objetivo")}
              placeholder="Exame físico, sinais vitais, resultados de exames"
            />
          </Field>
          <Field label="A — Avaliação" htmlFor="avaliacao">
            <Textarea
              id="avaliacao"
              rows={2}
              value={form.avaliacao}
              onChange={update("avaliacao")}
              placeholder="Hipóteses diagnósticas, impressão clínica"
            />
          </Field>
          <Field label="P — Plano" htmlFor="plano">
            <Textarea
              id="plano"
              rows={2}
              value={form.plano}
              onChange={update("plano")}
              placeholder="Conduta, prescrição, exames solicitados, orientações"
            />
          </Field>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Save className="h-4 w-4" aria-hidden="true" />
          )}
          Salvar evolução
        </button>
      </div>
    </form>
  )
}
