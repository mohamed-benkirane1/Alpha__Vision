import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4 px-4">
      <span className="text-6xl font-bold text-indigo-500">404</span>
      <h1 className="text-2xl font-bold text-white">Page not found</h1>
      <p className="text-gray-400">The page you're looking for doesn't exist.</p>
      <Link to="/" className="mt-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors">
        Back to Home
      </Link>
    </div>
  )
}

export default NotFound
