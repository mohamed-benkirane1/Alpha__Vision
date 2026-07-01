import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '../components/ui'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-app-bg flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">

      {/* Ambient */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-600/[0.04] rounded-full blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: 'linear-gradient(rgba(225,29,72,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(225,29,72,0.8) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative z-10"
      >
        {/* 404 — ghost text décoratif */}
        <p className="text-[8rem] sm:text-[10rem] font-black text-white/[0.05] leading-none select-none tracking-tight">
          404
        </p>

        {/* Contenu visible */}
        <div className="-mt-6 mb-8">
          <h1 className="text-display-sm font-bold text-white mb-3 tracking-tight">
            Page introuvable
          </h1>
          <p className="text-body text-white/40 max-w-sm mx-auto leading-relaxed">
            La page que vous cherchez n'existe pas ou a été déplacée.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Button as={Link} to="/" variant="primary" size="md" className="font-bold">
            Retour à l'accueil
          </Button>
          <Button
            as="button"
            onClick={() => window.history.back()}
            variant="secondary"
            size="md"
            className="font-bold"
          >
            Page précédente
          </Button>
        </div>

        {/* Signature */}
        <div className="mt-12 flex items-center justify-center gap-3">
          <div className="h-px w-12 bg-white/[0.06]" />
          <span className="text-caption text-white/20 tracking-widest uppercase font-bold">
            Alpha Vision
          </span>
          <div className="h-px w-12 bg-white/[0.06]" />
        </div>
      </motion.div>
    </div>
  )
}
