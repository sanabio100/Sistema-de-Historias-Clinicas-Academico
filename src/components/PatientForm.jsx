import { useState } from "react"
import { Loader2, UserPlus } from "lucide-react"
import { Field, Input, Select, Textarea } from "./ui/Field"
import { api } from "../lib/api"

const empty = {
  nome: "",
  idade: "",
  sexo: "",
  telefone: "",
  prontuario: "",
  dataNascimento: "",
  queixaPrincipal: "",
}

export function PatientForm({ onCreated, onCancel }) {
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.nome.trim()) {
      setError("O nome do paciente é obrigatório.")
      return
    }
    setSaving(true)
    setError(null)
    try {
      const { patient } = await api.createPatient(form)
      onCreated(patient)
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

      <Field label="Nome completo" htmlFor="nome" required>
        <Input id="nome" value={form.nome} onChange={update("nome")} placeholder="Ex.: Maria Silva Santos" />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Idade" htmlFor="idade">
          <Input id="idade" type="number" min="0" value={form.idade} onChange={update("idade")} placeholder="0" />
        </Field>
        <Field label="Sexo" htmlFor="sexo">
          <Select id="sexo" value={form.sexo} onChange={update("sexo")}>
            <option value="">Selecione</option>
            <option value="Feminino">Feminino</option>
            <option value="Masculino">Masculino</option>
            <option value="Outro">Outro</option>
          </Select>
        </Field>
        <Field label="Data de nascimento" htmlFor="dataNascimento">
          <Input
            id="dataNascimento"
            type="date"
            value={form.dataNascimento}
            onChange={update("dataNascimento")}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Telefone" htmlFor="telefone">
          <Input id="telefone" value={form.telefone} onChange={update("telefone")} placeholder="(00) 00000-0000" />
        </Field>
        <Field label="Nº do prontuário" htmlFor="prontuario">
          <Input id="prontuario" value={form.prontuario} onChange={update("prontuario")} placeholder="Ex.: PRT-2026-001" />
        </Field>
      </div>

      <Field label="Queixa principal" htmlFor="queixaPrincipal">
        <Textarea
          id="queixaPrincipal"
          rows={3}
          value={form.queixaPrincipal}
          onChange={update("queixaPrincipal")}
          placeholder="Motivo da consulta relatado pelo paciente"
        />
      </Field>

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
            <UserPlus className="h-4 w-4" aria-hidden="true" />
          )}
          Cadastrar paciente
        </button>
      </div>
    </form>
  )
}
