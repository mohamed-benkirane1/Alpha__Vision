import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, ArrowLeft } from 'lucide-react'

function NotFound() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-5 relative overflow-hidden">
      {/* Background glow */}
      <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/8 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute bottom-1/3 left-1/3 w-[300px] h-[300px] bg-violet-600/6 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative text-center"
      >
        {/* 404 number */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6"
        >
          <span className="text-[7rem] sm:text-[9rem] font-bold leading-none bg-gradient-to-b from-indigo-400 via-violet-400 to-indigo-600 bg-clip-text text-transparent select-none">
            404
          </span>
        </motion.div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="mb-8"
        >
          <h1 className="text-xl font-bold text-white mb-2">Page not found</h1>
          <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </motion.div>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="flex items-center justify-center gap-3 flex-wrap"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <Home size={14} />
            Back to home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-gray-700/80 text-white text-sm rounded-lg transition-colors"
          >
            <ArrowLeft size={14} />
            Go back
          </button>
        </motion.div>

        {/* Decorative divider */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 flex items-center justify-center gap-3"
        >
          <div className="h-px w-16 bg-gray-800" />
          <span className="text-xs text-gray-600">Alpha Vision</span>
          <div className="h-px w-16 bg-gray-800" />
        </motion.div>
      </motion.div>
    </div>
  )
}

export default NotFound
