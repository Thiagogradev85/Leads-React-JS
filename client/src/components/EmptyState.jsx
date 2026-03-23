export function EmptyState({ icon: Icon, message = 'Nenhum item encontrado' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
      {Icon && <Icon size={40} className="mb-3 opacity-30" />}
      <p className="text-sm">{message}</p>
    </div>
  )
}
