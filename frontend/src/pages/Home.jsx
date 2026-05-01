function Home() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-6 px-4">
      <h1 className="text-5xl font-bold text-white tracking-tight">Alpha Vision</h1>
      <p className="text-lg text-gray-400">Trading intelligence powered by AI</p>
      <div className="flex gap-4">
        <a href="/login" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-colors">
          Login
        </a>
        <a href="/signup" className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors">
          Sign Up
        </a>
      </div>
    </div>
  )
}

export default Home
