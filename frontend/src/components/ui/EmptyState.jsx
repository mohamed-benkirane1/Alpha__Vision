/**
 * EmptyState — état vide illustré pour tableaux, listes et panneaux.
 *
 * Props :
 *   icon        Composant lucide-react
 *   title       string — titre court
 *   description string — ligne d'explication (optionnel)
 *   action      ReactNode — CTA optionnel (bouton, lien…)
 *   className   string
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}>
      {Icon && (
        <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center mb-4">
          <Icon size={22} className="text-white/20" />
        </div>
      )}
      <p className="text-body font-medium text-white/50 mb-1">{title}</p>
      {description && (
        <p className="text-body-sm text-white/30 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
