import { useState } from "react"
import { Layout } from "./components/Layout"
import { Dashboard } from "./components/Dashboard"
import { PatientDetail } from "./components/PatientDetail"

export default function App() {
  // Navegação simples baseada em estado: lista <-> detalhe do paciente
  const [selectedPatientId, setSelectedPatientId] = useState(null)

  return (
    <Layout>
      {selectedPatientId ? (
        <PatientDetail
          patientId={selectedPatientId}
          onBack={() => setSelectedPatientId(null)}
        />
      ) : (
        <Dashboard onSelectPatient={setSelectedPatientId} />
      )}
    </Layout>
  )
}
