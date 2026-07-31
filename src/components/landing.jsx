import Logo from './Logo'

function Landing({ onGetStarted }) {
  return (
    <div className="min-h-screen bg-gray-900">
      <nav className="flex items-center justify-between px-6 md:px-12 py-5 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Logo size={28} />
          <span className="text-white font-medium">Leadflow</span>
        </div>
        <button
          onClick={onGetStarted}
          className="text-sm text-gray-300 hover:text-white transition"
        >
          Sign in
        </button>
      </nav>

      <div className="max-w-5xl mx-auto px-6 md:px-12 py-20 md:py-28">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-semibold text-white leading-tight">
            Find your next customer, without the guesswork
          </h1>
          <p className="text-gray-400 text-base md:text-lg mt-5 leading-relaxed">
            Leadflow searches Google, Instagram, and Facebook for businesses that match
            what you're selling — then uses AI to score how likely each one is to need
            you, and drafts the first message for you.
          </p>

          <div className="flex items-center gap-4 mt-8">
            <button
              onClick={onGetStarted}
              className="bg-gradient-to-r from-purple-600 to-purple-500 text-white px-6 py-3 rounded-lg text-sm font-medium hover:opacity-90 transition"
            >
              Get started — it's free
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-20">
          <div className="bg-gray-800 rounded-2xl p-6">
            <div className="w-9 h-9 rounded-lg bg-purple-600/20 flex items-center justify-center mb-4">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-400">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </div>
            <p className="text-white text-sm font-medium mb-1">Search everywhere at once</p>
            <p className="text-gray-500 text-xs leading-relaxed">
              One search covers Google, Instagram, and Facebook — no juggling tabs.
            </p>
          </div>

          <div className="bg-gray-800 rounded-2xl p-6">
            <div className="w-9 h-9 rounded-lg bg-purple-600/20 flex items-center justify-center mb-4">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-400">
                <path d="M13 2L3 14h7v8l10-12h-7z" />
              </svg>
            </div>
            <p className="text-white text-sm font-medium mb-1">AI scores every lead</p>
            <p className="text-gray-500 text-xs leading-relaxed">
              Each business is marked hot, warm, or cold, with a real reason why.
            </p>
          </div>

          <div className="bg-gray-800 rounded-2xl p-6">
            <div className="w-9 h-9 rounded-lg bg-purple-600/20 flex items-center justify-center mb-4">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-400">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M22 6l-10 7L2 6" />
              </svg>
            </div>
            <p className="text-white text-sm font-medium mb-1">Outreach drafted for you</p>
            <p className="text-gray-500 text-xs leading-relaxed">
              A ready-to-send message for each lead, grounded in why they're a fit.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Landing