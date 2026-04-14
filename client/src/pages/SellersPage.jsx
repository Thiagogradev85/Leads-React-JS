import { useState, useEffect, useMemo } from 'react'
import { Plus, Edit2, Trash2, UserCheck } from 'lucide-react'
import { api } from '../utils/api.js'
import { UFS, whatsappLink } from '../utils/constants.js'
import { EmptyState } from '../components/EmptyState.jsx'
import { useModal } from '../hooks/useModal.js'

// takenUFs: Set de UFs já ocupadas por OUTROS vendedores
function SellerForm({ initial = {}, takenUFs = new Set(), onSave, onCancel }) {
  const [nome,     setNome]     = useState(initial.nome || '')
  const [whatsapp, setWhatsapp] = useState(initial.whatsapp || '')
  const [ufs,      setUfs]      = useState(initial.ufs || [])
  const [loading,  setLoading]  = useState(false)

  function toggleUF(uf) {
    if (takenUFs.has(uf)) return
    setUfs(prev =>
      prev.includes(uf) ? prev.filter(u => u !== uf) : [...prev, uf]
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!nome) return
    setLoading(true)
    try { await onSave({ nome, whatsapp, ufs }) }
    finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Nome *</label>
        <input className="input" value={nome} onChange={e => setNome(e.target.value)} required />
      </div>
      <div>
        <label className="label">WhatsApp</label>
        <input className="input" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="5511..." />
      </div>
      <div>
        <label className="label">Estados que atende</label>
        {takenUFs.size > 0 && (
          <p className="text-xs text-zinc-500 mt-1 mb-1">
            UFs em cinza já estão atribuídas a outro vendedor e não podem ser selecionadas.
          </p>
        )}
        <div className="flex flex-wrap gap-1.5 mt-1">
          {UFS.map(uf => {
            const isTaken    = takenUFs.has(uf)
            const isSelected = ufs.includes(uf)
            return (
              <button
                key={uf}
                type="button"
                onClick={() => toggleUF(uf)}
                disabled={isTaken}
                title={isTaken ? 'Já atribuída a outro vendedor' : undefined}
                className={`px-2 py-1 rounded text-xs font-bold transition-colors ${
                  isTaken
                    ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed opacity-50'
                    : isSelected
                      ? 'bg-sky-600 text-white'
                      : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'
                }`}
              >
                {uf}
              </button>
            )
          })}
        </div>
      </div>
      <div className="flex gap-2">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar'}
        </button>
        {onCancel && <button type="button" className="btn-secondary" onClick={onCancel}>Cancelar</button>}
      </div>
    </form>
  )
}

export function SellersPage() {
  const [sellers, setSellers] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]  = useState(null)
  const { modal, showModal } = useModal()

  async function load() {
    setLoading(true)
    try { setSellers(await api.listSellers()) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  // UFs de todos os vendedores: { uf → nome_vendedor }
  const allTakenMap = useMemo(() => {
    const map = new Map()
    sellers.forEach(s => (s.ufs || []).forEach(uf => map.set(uf, s.nome)))
    return map
  }, [sellers])

  // Para o form de criação: todas as UFs já ocupadas
  const takenForCreate = useMemo(() => new Set(allTakenMap.keys()), [allTakenMap])

  // Para o form de edição de seller X: UFs ocupadas por outros (não pelo próprio X)
  function takenForEdit(seller) {
    const ownUFs = new Set(seller.ufs || [])
    const taken = new Set()
    allTakenMap.forEach((_, uf) => { if (!ownUFs.has(uf)) taken.add(uf) })
    return taken
  }

  async function handleCreate(data) {
    try {
      await api.createSeller(data)
      setShowForm(false)
      showModal({ type: 'success', title: 'Sucesso', message: 'Vendedor criado!' })
      load()
    } catch (err) { showModal({ type: 'error', title: 'Erro', message: err.message }) }
  }

  async function handleUpdate(id, data) {
    try {
      await api.updateSeller(id, data)
      setEditing(null)
      showModal({ type: 'success', title: 'Sucesso', message: 'Vendedor atualizado!' })
      load()
    } catch (err) { showModal({ type: 'error', title: 'Erro', message: err.message }) }
  }

  function handleDelete(seller) {
    showModal({
      type: 'warning',
      title: `Excluir vendedor "${seller.nome}"?`,
      message: 'Esta ação é permanente e não pode ser desfeita.',
      actions: [
        {
          label: 'Sim, excluir',
          variant: 'danger',
          onClick: async () => {
            try {
              await api.deleteSeller(seller.id)
              showModal({ type: 'success', title: 'Sucesso', message: 'Vendedor excluído.' })
              load()
            } catch (err) { showModal({ type: 'error', title: 'Erro', message: err.message }) }
          },
        },
      ],
    })
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      {modal}

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-100">Vendedores</h1>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={15} /> Novo Vendedor
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h2 className="font-semibold text-zinc-200 mb-4">Novo Vendedor</h2>
          <SellerForm
            takenUFs={takenForCreate}
            onSave={handleCreate}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-zinc-500 text-sm">Carregando...</div>
      ) : sellers.length === 0 ? (
        <EmptyState icon={UserCheck} message="Nenhum vendedor cadastrado" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sellers.map(sel => (
            <div key={sel.id} className="card space-y-3">
              {editing?.id === sel.id ? (
                <SellerForm
                  initial={sel}
                  takenUFs={takenForEdit(sel)}
                  onSave={(d) => handleUpdate(sel.id, d)}
                  onCancel={() => setEditing(null)}
                />
              ) : (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-zinc-100">{sel.nome}</h3>
                      {sel.whatsapp && (
                        <a href={whatsappLink(sel.whatsapp)} target="_blank" rel="noreferrer"
                          className="text-xs text-green-400 hover:text-green-300">
                          {sel.whatsapp}
                        </a>
                      )}
                    </div>
                    <div className="flex gap-1.5">
                      <button className="btn-ghost btn-sm" onClick={() => setEditing(sel)}>
                        <Edit2 size={13} />
                      </button>
                      <button className="btn-danger btn-sm" onClick={() => handleDelete(sel)}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="label">Estados atendidos</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {sel.ufs && sel.ufs.length > 0
                        ? sel.ufs.map(uf => (
                            <span key={uf} className="px-1.5 py-0.5 bg-sky-900/50 text-sky-300 rounded text-xs font-bold">
                              {uf}
                            </span>
                          ))
                        : <span className="text-zinc-600 text-xs">Nenhum estado definido</span>
                      }
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
