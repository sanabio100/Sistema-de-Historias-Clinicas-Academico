import { Stethoscope, GraduationCap } from "lucide-react"

export function Layout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
              <Stethoscope className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-base font-semibold leading-tight text-slate-900">
                MedSimb
              </h1>
              <p className="text-xs text-slate-500">Prontuários Clínicos Acadêmicos</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 sm:flex">
            <GraduationCap className="h-4 w-4" aria-hidden="true" />
            Ambiente de ensino
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  )
}
