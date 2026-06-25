import { useEffect, useState } from "react"
import {
  ArrowLeft,
  Plus,
  Phone,
  FileText,
  Cake,
  User,
  ClipboardList,
  History,
} from "lucide-react"
import { api } from "../lib/api"
import { formatDate, getInitials } from "../lib/format"
import { Spinner, ErrorState, EmptyState } from "./ui/Feedback"
import { Modal } from "./ui/Modal"
import { Timeline } from "./Timeline"
import { EvolutionForm } from "./EvolutionForm"

function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="truncate text-sm font-medium text-slate-800">{value || "—"}</p>
      </div>
    </div>
  )
}

export function PatientDetail({ patientId, onBack }) {
  const [patient, setPatient] = useState(null)
  const [evolutions, setEvolutions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [{ patient }, { evolutions }] = await Promise.all([
        api.getPatient(patientId),
        api.listEvolutions(patientId),
      ])
      setPatient(patient)
      setEvolutions(evolutions)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId])

  function handleCreated(evolution) {
    setEvolutions((list) =>
      [evolution, ...list].sort((a, b) => new Date(b.data) - new Date(a.data)),
    )
    setShowForm(false)
  }

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-brand-700"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Voltar para a lista
      </button>

      {loading ? (
        <Spinner label="Carregando prontuário..." />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        patient && (
          <>
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-4">
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-100 text-lg font-semibold text-brand-700">
                    {getInitials(patient.nome)}
                  </span>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">{patient.nome}</h2>
                    <p className="text-sm text-slate-500">
                      Prontuário {patient.prontuario || "não informado"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Nova evolução
                </button>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2 lg:grid-cols-3">
                <InfoItem icon={User} label="Sexo" value={patient.sexo} />
                <InfoItem
                  icon={Cake}
                  label="Idade"
                  value={patient.idade != null ? `${patient.idade} anos` : ""}
                />
                <InfoItem
                  icon={FileText}
                  label="Data de nascimento"
                  value={patient.dataNascimento ? formatDate(patient.dataNascimento) : ""}
                />
                <InfoItem icon={Phone} label="Telefone" value={patient.telefone} />
                <InfoItem
                  icon={ClipboardList}
                  label="Queixa principal"
                  value={patient.queixaPrincipal}
                />
              </div>
            </section>

            <section>
              <div className="mb-4 flex items-center gap-2">
                <History className="h-5 w-5 text-slate-500" aria-hidden="true" />
                <h3 className="text-lg font-semibold text-slate-900">Linha do tempo clínica</h3>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                  {evolutions.length}
                </span>
              </div>

              {evolutions.length === 0 ? (
                <EmptyState
                  icon={ClipboardList}
                  title="Nenhuma evolução registrada"
                  description="Adicione a primeira evolução clínica deste paciente."
                  action={
                    <button
                      onClick={() => setShowForm(true)}
                      className="mt-2 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                      Adicionar evolução
                    </button>
                  }
                />
              ) : (
                <Timeline evolutions={evolutions} />
              )}
            </section>

            <Modal
              open={showForm}
              onClose={() => setShowForm(false)}
              title="Nova evolução clínica"
              description={`Paciente: ${patient.nome}`}
            >
              <EvolutionForm
                patient={patient}
                onCreated={handleCreated}
                onCancel={() => setShowForm(false)}
              />
            </Modal>
          </>
        )
      )}
    </div>
  )
}
