import React, { useState } from 'react';
import { 
  Activity, 
  Users, 
  FileText, 
  PlusCircle, 
  Search, 
  SlidersHorizontal, 
  Database,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
      {/* Barra de Navegação Hospitalar Superior */}
      <header className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white shadow-md border-b border-blue-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500 p-2 rounded-lg text-white animate-pulse">
              <Activity size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">MedSimb <span className="text-xs font-normal bg-blue-600 px-2 py-0.5 rounded-full ml-2 text-blue-100 border border-blue-400">Ambiente de Estudo</span></h1>
              <p className="text-xs text-blue-200">Sistema Simulado de Prontuários Médicos</p>
            </div>
          </div>
          
          <nav className="flex items-center gap-2 bg-blue-950/40 p-1.5 rounded-xl border border-blue-800/60">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow' : 'text-blue-200 hover:bg-blue-900/50'}`}
            >
              <Users size={16} /> Pacientes
            </button>
            <button 
              onClick={() => setActiveTab('notion')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${activeTab === 'notion' ? 'bg-blue-600 text-white shadow' : 'text-blue-200 hover:bg-blue-900/50'}`}
            >
              <Database size={16} /> Conexão Notion
            </button>
          </nav>
        </div>
      </header>

      {/* Banner de Aviso Acadêmico */}
      <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-6 py-2.5 text-xs font-medium flex items-center justify-center gap-2">
        <AlertCircle size={14} className="text-amber-600 shrink-0" />
        <span><strong>Uso Restrito para Aprendizado:</strong> Ambiente simulado. Nunca utilize ou insira informações identificáveis de pacientes reais.</span>
      </div>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8">
        
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Seção de Filtros e Busca Fictícia */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Buscar paciente simulado por nome ou queixa..." 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  disabled
                />
              </div>
              <button className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-colors cursor-not-allowed opacity-75">
                <PlusCircle size={16} /> Novo Paciente
              </button>
            </div>

            {/* Estado Inicial Branco / Placeholder do Deploy */}
            <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-8 md:p-16 text-center shadow-sm max-w-2xl mx-auto my-8">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-100">
                <FileText className="text-blue-600" size={28} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">Primeiro Deploy Concluído! 🚀</h2>
              <p className="text-slate-500 text-sm max-w-md mx-auto mb-8 leading-relaxed">
                Esta é a página web inicial em branco do seu sistema de histórias clínicas. A interface e a estrutura de hospedagem na Vercel já estão prontas para receber o código gerado pela IA.
              </p>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-left space-y-3 mb-8">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <SlidersHorizontal size={12} /> Próximos Passos Recomendados
                </h3>
                <ul className="text-xs text-slate-600 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 font-bold">1.</span>
                    <span>Cole este repositório no seu gerador de código com IA (como Bolt.new ou Cursor).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 font-bold">2.</span>
                    <span>Peça para a IA renderizar os dados dinâmicos utilizando a API do Notion.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 font-bold">3.</span>
                    <span>Faça o commit das alterações para atualizar esta tela automaticamente!</span>
                  </li>
                </ul>
              </div>

              <div className="text-xs text-slate-400 flex items-center justify-center gap-1.5">
                <span>Pronto para conectar seu banco de dados</span>
                <ArrowRight size={12} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notion' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 max-w-xl mx-auto animate-fadeIn">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
              <div className="bg-purple-50 p-2 rounded-lg text-purple-600">
                <Database size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Configuração do Banco de Dados</h2>
                <p className="text-xs text-slate-500">Credenciais para espelhamento com o Notion API</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Status da Integração</label>
                <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 border border-amber-200 text-xs px-2.5 py-1 rounded-full font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                  Aguardando Variáveis de Ambiente da Vercel
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs font-mono text-slate-600">
                <p><span className="text-purple-600 font-bold">NOTION_TOKEN</span> = "secret_********..."</p>
                <p><span className="text-purple-600 font-bold">PATIENTS_DB_ID</span> = "db_********..."</p>
                <p><span className="text-purple-600 font-bold">HISTORY_DB_ID</span> = "db_********..."</p>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed bg-blue-50 p-3 rounded-lg border border-blue-100">
                ℹ️ <strong>Dica técnica:</strong> No Vercel Dashboard, vá em <em>Settings &gt; Environment Variables</em> para cadastrar estas chaves de forma totalmente segura e oculta.
              </p>
            </div>
          </div>
        )}

      </main>

      <footer className="bg-slate-100 border-t border-slate-200 text-center py-4 text-xs text-slate-400 mt-auto">
        <p>© 2026 MedSimb App. Desenvolvido para fins didáticos e fixação de raciocínio clínico.</p>
      </footer>
    </div>
  );
}
