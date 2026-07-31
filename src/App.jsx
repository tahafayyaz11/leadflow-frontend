import { useState, useEffect } from 'react'
import Landing from './components/landing'
import Login from './components/Login'
import SearchScreen from './components/SearchScreen'
import { supabase } from './lib/supabase'

function App() {
  const [view, setView] = useState('landing') // 'landing' | 'login' | 'app'
  const [user, setUser] = useState(null)
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        setView('app')
      }
      setCheckingSession(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user)
        setView('app')
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  if (checkingSession) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-gray-700 border-t-purple-500 animate-spin" />
      </div>
    )
  }

  if (view === 'landing') {
    return (
      <div className="page-transition">
        <Landing onGetStarted={() => setView('login')} />
      </div>
    )
  }

  if (view === 'login') {
    return (
      <div className="page-transition">
        <Login
          onLoginSuccess={(u) => {
            setUser(u)
            setView('app')
          }}
          onBack={() => setView('landing')}
        />
      </div>
    )
  }

  return (
    <div className="page-transition">
      <SearchScreen user={user} />
    </div>
  )
}

export default App