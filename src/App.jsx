import { useState } from 'react'
import Login from './components/Login'
import SearchScreen from './components/SearchScreen'

function App() {
  const [user, setUser] = useState(null)

  if (!user) {
    return <Login onLoginSuccess={setUser} />
  }

  return <SearchScreen user={user} />
}

export default App