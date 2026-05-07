import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, ArrowLeft, Compass } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#070E20] flex flex-col items-center justify-center px-5 relative overflow-hidden">

      {/* Ambient orbs */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/[0.06] rounded-full blur-[120px]" />
      <div className="pointer-events-none absolute bottom-1/3 left-1/3 w-[280px] h-[280px] bg-violet-600/[0.05] rounded-full blur-[80px]" />
      <div className="pointer-events-none absolute top-1/4 right-1/4 w-[200px] h-[200px] bg-blue-600/[0.04] rounded-full blur-[60px]" />

      {/* Animated grid lines */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: 'linear-gradient(rgba(99,102,241,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.8) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative text-center"
      >
        {/* 404 */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1, type: 'spring', stiffness: 180, damping: 20 }}
          className="relative mb-4 select-none"
        >
          {/* Glow behind the number */}
          <div className="absolute inset-0 blur-[60px] bg-indigo-500/20 rounded-full scale-75" />
          <span className="relative text-[8rem] sm:text-[10rem] font-black leading-none bg-gradient-to-b from-white via-indigo-200 to-indigo-500/50 bg-clip-text text-transparent">
            404
          </span>
        </motion.div>

        {/* Decorative line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.55, delay: 0.3 }}
          className="h-px w-48 mx-auto bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent mb-7"
        />

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="mb-8 space-y-2"
        >
          <h1 className="text-xl font-black text-white tracking-tight">Page not found</h1>
          <p className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed font-medium">
            The page you're looking for doesn't exist or has been moved to another location.
          </p>
        </motion.div>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.45 }}
          className="flex items-center justify-center gap-3 flex-wrap"
        >
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link
              to="/"
              className="ripple-btn inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-black rounded-xl shadow-[0_0_22px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] transition-all duration-200"
            >
              <Home size={14} />
              Back to home
            </Link>
          </motion.div>

          <motion.button
            onClick={() => window.history.back()}
            whileHover={{ scale: 1.03, backgroundColor: 'rgba(255,255,255,0.06)' }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/[0.04] border border-white/[0.09] text-slate-300 text-sm font-bold rounded-xl transition-all duration-200"
          >
            <ArrowLeft size={14} />
            Go back
          </motion.button>
        </motion.div>

        {/* Footer badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 flex items-center justify-center gap-3"
        >
          <div className="h-px w-12 bg-white/[0.06]" />
          <div className="flex items-center gap-1.5 text-[10px] text-slate-700 font-bold tracking-widest uppercase">
            <Compass size={10} />
            Alpha Vision
          </div>
          <div className="h-px w-12 bg-white/[0.06]" />
        </motion.div>
      </motion.div>
    </div>
  )
}
