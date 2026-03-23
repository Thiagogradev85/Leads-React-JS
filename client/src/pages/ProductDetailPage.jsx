import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit2, Save, X, Plus, Trash2, Package } from 'lucide-react'
import { api } from '../utils/api.js'
import { formatDate } from '../utils/constants.js'
import { EmptyState } from '../components/EmptyState.jsx'
import { Toast } from '../components/Toast.jsx'

const EMPTY_PRODUCT = {
  nome: '', modelo: '', bateria: '', motor: '',
  velocidade_min: '', velocidade_max: '', pneu: '', suspensao: '',
  autonomia: '', carregador: '', peso: '', impermeabilidade: '',
  estoque: 0, imagem: '', extra: '', preco: ''
}

function ProductForm({ initial = {}, onSave, onCancel }) {
  const [form, setForm] = useState({ ...EMPTY_PRODUCT, ...initial })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try { await onSave(form) }
    finally { setLoading(false) }
  }

  const num = (k) => (
    <input type="number" step="0.01" className="input"
      value={form[k]} onChange={e => set(k, e.target.value)} />
  )
  const txt = (k, placeholder) => (
    <input className="input" value={form[k] || ''}
      onChange={e => set(k, e.target.value)} placeholder={placeholder} />
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="label">Nome *</label>
          {txt('nome')}
        </div>
        <div><label className="label">Modelo</label>{txt('modelo')}</div>
        <div><label className="label">Preço (R$)</label>{num('preco')}</div>
        <div><label className="label">Bateria</label>{txt('bateria', 'Ex: 48V 15Ah')}</div>
        <div><label className="label">Motor</label>{txt('motor', 'Ex: 500W')}</div>
        <div><label className="label">Vel. Mín. (km/h)</label>{num('velocidade_min')}</div>
        <div><label className="label">Vel. Máx. (km/h)</label>{num('velocidade_max')}</div>
        <div><label className="label">Pneu</label>{txt('pneu', 'Ex: 10"')}</div>
        <div><label className="label">Suspensão</label>{txt('suspensao')}</div>
        <div><label className="label">Autonomia</label>{txt('autonomia', 'Ex: 40-60km')}</div>
        <div><label className="label">Carregador</label>{txt('carregador', 'Ex: 2A')}</div>
        <div><label className="label">Peso (kg)</label>{num('peso')}</div>
        <div><label className="label">Impermeabilidade</label>{txt('impermeabilidade', 'Ex: IPX4')}</div>
        <div><label className="label">Estoque</label>
          <input type="number" className="input" value={form.estoque}
            onChange={e => set('estoque', parseInt(e.target.value) || 0)} />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Imagem (URL)</label>
          {txt('imagem', 'https://...')}
        </div>
        <div className="sm:col-span-2">
          <label className="label">Extras / Observações</label>
          <textarea className="input resize-none" rows={3}
            value={form.extra || ''} onChange={e => set('extra', e.target.value)} />
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

export function ProductDetailPage() {
  const { catalogId } = useParams()
  const navigate = useNavigate()

  const [catalog, setCatalog]   = useState(null)
  const [products, setProducts] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState(null)
  const [loading, setLoading]   = useState(false)
  const [toast, setToast]       = useState(null)

  const showToast = (m, t = 'success') => setToast({ message: m, type: t })

  const load = useCallback(async () => {
    if (!catalogId || catalogId === 'all') return
    setLoading(true)
    try {
      const cat = await api.getCatalog(catalogId)
      setCatalog(cat)
      setProducts(cat.products || [])
    } finally {
      setLoading(false)
    }
  }, [catalogId])

  useEffect(() => { load() }, [load])

  async function handleCreate(data) {
    try {
      await api.createProduct(catalogId, data)
      setShowForm(false)
      showToast('Produto criado!')
      load()
    } catch (err) { showToast(err.message, 'error') }
  }

  async function handleUpdate(prodId, data) {
    try {
      await api.updateProduct(catalogId, prodId, data)
      setEditing(null)
      showToast('Produto atualizado!')
      load()
    } catch (err) { showToast(err.message, 'error') }
  }

  async function handleDelete(prod) {
    if (!confirm(`Excluir produto "${prod.nome}"?`)) return
    try {
      await api.deleteProduct(catalogId, prod.id)
      showToast('Produto excluído.')
      load()
    } catch (err) { showToast(err.message, 'error') }
  }

  async function handleUpdateStock(prod, estoque) {
    try {
      await api.updateStock(catalogId, prod.id, parseInt(estoque))
      load()
    } catch (err) { showToast(err.message, 'error') }
  }

  if (loading && !catalog) return <div className="p-6 text-zinc-500 text-sm">Carregando...</div>

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-4xl mx-auto">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <button className="btn-ghost btn-sm" onClick={() => navigate('/catalogs')}>
        <ArrowLeft size={15} /> Catálogos
      </button>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">{catalog?.nome}</h1>
          <p className="text-xs text-zinc-500">{formatDate(catalog?.data)} · {products.length} produtos</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={15} /> Novo Produto
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h2 className="font-semibold text-zinc-200 mb-4">Novo Produto</h2>
          <ProductForm onSave={handleCreate} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {products.length === 0 && !showForm ? (
        <EmptyState icon={Package} message="Nenhum produto neste catálogo" />
      ) : (
        <div className="space-y-3">
          {products.map(prod => (
            <div key={prod.id} className="card">
              {editing?.id === prod.id ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-zinc-200">Editando: {prod.nome}</h3>
                    <button className="btn-ghost btn-sm" onClick={() => setEditing(null)}>
                      <X size={14} />
                    </button>
                  </div>
                  <ProductForm
                    initial={prod}
                    onSave={(d) => handleUpdate(prod.id, d)}
                    onCancel={() => setEditing(null)}
                  />
                </>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-zinc-100">{prod.nome}</h3>
                      {prod.modelo && <p className="text-xs text-zinc-500">{prod.modelo}</p>}
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button className="btn-ghost btn-sm" onClick={() => setEditing(prod)}>
                        <Edit2 size={13} />
                      </button>
                      <button className="btn-danger btn-sm" onClick={() => handleDelete(prod)}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {prod.imagem && (
                    <img src={prod.imagem} alt={prod.nome}
                      className="w-full max-w-xs rounded-lg object-contain bg-zinc-800 p-2" />
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                    <Spec label="Preço"     value={prod.preco ? `R$ ${Number(prod.preco).toFixed(2)}` : null} />
                    <Spec label="Bateria"   value={prod.bateria} />
                    <Spec label="Motor"     value={prod.motor} />
                    <Spec label="Vel. min"  value={prod.velocidade_min ? `${prod.velocidade_min} km/h` : null} />
                    <Spec label="Vel. max"  value={prod.velocidade_max ? `${prod.velocidade_max} km/h` : null} />
                    <Spec label="Autonomia" value={prod.autonomia} />
                    <Spec label="Pneu"      value={prod.pneu} />
                    <Spec label="Suspensão" value={prod.suspensao} />
                    <Spec label="Carregador"value={prod.carregador} />
                    <Spec label="Peso"      value={prod.peso ? `${prod.peso} kg` : null} />
                    <Spec label="Impermeab."value={prod.impermeabilidade} />
                  </div>

                  <div className="flex items-center gap-3 pt-1 border-t border-zinc-800">
                    <label className="text-xs text-zinc-400 font-medium">Estoque:</label>
                    <input
                      type="number"
                      className="input w-20 text-center"
                      value={prod.estoque}
                      onChange={e => handleUpdateStock(prod, e.target.value)}
                      min={0}
                    />
                    <span className="text-xs text-zinc-600">unidades</span>
                  </div>

                  {prod.extra && (
                    <p className="text-xs text-zinc-500 border-t border-zinc-800 pt-2">{prod.extra}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Spec({ label, value }) {
  if (!value) return null
  return (
    <div>
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="text-zinc-200 font-medium">{value}</p>
    </div>
  )
}
