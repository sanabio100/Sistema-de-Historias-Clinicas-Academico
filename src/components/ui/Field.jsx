const baseInput =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"

export function Field({ label, htmlFor, required, children, className = "" }) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}

export function Input(props) {
  return <input {...props} className={`${baseInput} ${props.className ?? ""}`} />
}

export function Textarea(props) {
  return <textarea {...props} className={`${baseInput} resize-y ${props.className ?? ""}`} />
}

export function Select({ children, ...props }) {
  return (
    <select {...props} className={`${baseInput} ${props.className ?? ""}`}>
      {children}
    </select>
  )
}
