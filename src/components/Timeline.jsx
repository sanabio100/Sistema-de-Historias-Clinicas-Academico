import { Activity } from "lucide-react"
import { formatDate } from "../lib/format"

const TIPO_CORES = {
  Consulta: "bg-blue-100 text-blue-700",
  "Evolução": "bg-brand-100 text-brand-700",
  Anamnese: "bg-amber-100 text-amber-700",
  Exame: "bg-violet-100 text-violet-700",
  Procedimento: "bg-rose-100 text-rose-700",
  Alta: "bg-emerald-100 text-emerald-700",
}

function SoapBlock({ label, value }) {
  if (!value) return null
  return (
    <div className="text-sm">
      <span className="font-semibold text-slate-700">{label}: </span>
      <span className="whitespace-pre-wrap text-slate-600">{value}</span>
    </div>
  )
}

export function Timeline({ evolutions }) {
  return (
    <ol className="relative space-y-6 border-l-2 border-slate-200 pl-6">
      {evolutions.map((ev) => (
        <li key={ev.id} className="relative">
          <span
            className="absolute -left-[31px] flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 ring-4 ring-slate-50"
            aria-hidden="true"
          >
            <Activity className="h-3 w-3 text-white" />
          </span>
          <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <header className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-slate-900">{ev.resumo}</h4>
                {ev.tipo && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      TIPO_CORES[ev.tipo] ?? "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {ev.tipo}
                  </span>
                )}
              </div>
              <time className="text-xs font-medium text-slate-400">{formatDate(ev.data)}</time>
            </header>
            <div className="space-y-1.5">
              <SoapBlock label="S" value={ev.subjetivo} />
              <SoapBlock label="O" value={ev.objetivo} />
              <SoapBlock label="A" value={ev.avaliacao} />
              <SoapBlock label="P" value={ev.plano} />
              {!ev.subjetivo && !ev.objetivo && !ev.avaliacao && !ev.plano && (
                <p className="text-sm italic text-slate-400">Sem detalhamento clínico registrado.</p>
              )}
            </div>
          </article>
        </li>
      ))}
    </ol>
  )
}
