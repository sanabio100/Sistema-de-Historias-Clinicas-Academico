import { useEffect, useRef, useState } from "react"
import { Search, UserPlus, Users, ChevronRight, Phone, FileText } from "lucide-react"
import { api } from "../lib/api"
import { formatDate, getInitials } from "../lib/format"
import { Spinner, ErrorState, EmptyState } from "./ui/Feedback"
import { Modal } from "./ui/Modal"
import { PatientForm } from "./PatientForm"

export function Dashboard({ onSelectPatient }) {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState("")
  const [showForm, setShowForm] = useState(false)
  const debounceRef = useRef(null)

  async function load(searchTerm = "") {
    setLoading(true)
    setError(null)
    try {
      const { patients } = await api.listPatients(searchTerm)
      setPatients(patients)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load("")
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => load(search), 350)
    return () => clearTimeout(debounceRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  function handleCreated(patient) {
    setShowForm(false)
    onSelectPatient(patient.id)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Pacientes</h2>
          <p className="text-sm text-slate-500">Gerencie os prontuários e evoluções clínicas</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          Novo paciente
        </button>
      </div>

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar paciente pelo nome..."
          aria-label="Buscar paciente"
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </div>

      {loading ? (
        <Spinner label="Carregando pacientes..." />
      ) : error ? (
        <ErrorState message={error} onRetry={() => load(search)} />
      ) : patients.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search ? "Nenhum paciente encontrado" : "Nenhum paciente cadastrado"}
          description={
            search
              ? "Tente buscar por outro nome ou cadastre um novo paciente."
              : "Comece cadastrando o primeiro paciente para registrar suas evoluções clínicas."
          }
          action={
            !search && (
              <button
                onClick={() => setShowForm(true)}
                className="mt-2 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                <UserPlus className="h-4 w-4" aria-hidden="true" />
                Cadastrar paciente
              </button>
            )
          }
        />
      ) : (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {patients.map((patient) => (
            <li key={patient.id}>
              <button
                onClick={() => onSelectPatient(patient.id)}
                className="group flex w-full items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-brand-300 hover:shadow-md"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                  {getInitials(patient.nome)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-slate-900">{patient.nome}</span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
                    {patient.idade != null && <span>{patient.idade} anos</span>}
                    {patient.sexo && <span>{patient.sexo}</span>}
                    {patient.prontuario && (
                      <span className="inline-flex items-center gap-1">
                        <FileText className="h-3 w-3" aria-hidden="true" />
                        {patient.prontuario}
                      </span>
                    )}
                    {patient.telefone && (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3 w-3" aria-hidden="true" />
                        {patient.telefone}
                      </span>
                    )}
                  </span>
                  <span className="mt-1 block text-xs text-slate-400">
                    Cadastrado em {formatDate(patient.criadoEm)}
                  </span>
                </span>
                <ChevronRight
                  className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:text-brand-500"
                  aria-hidden="true"
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title="Novo paciente"
        description="Preencha os dados demográficos do paciente"
      >
        <PatientForm onCreated={handleCreated} onCancel={() => setShowForm(false)} />
      </Modal>
    </div>
  )
}
