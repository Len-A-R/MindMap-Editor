import React, { useState, useEffect } from 'react'
import Auth from '@components/Auth/Auth'
import MindMap from '@components/MindMap/MindMap'

function App() {
  const [user, setUser] = useState(null)

  // Check for existing session
  useEffect(() => {
    const savedUser = localStorage.getItem('mindmap_current_user')
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (e) {
        localStorage.removeItem('mindmap_current_user')
      }
    }
  }, [])

  const handleLogin = (userData) => {
    localStorage.setItem('mindmap_current_user', JSON.stringify(userData))
    setUser(userData)
  }

  const handleLogout = () => {
    localStorage.removeItem('mindmap_current_user')
    setUser(null)
  }

  if (!user) {
    return <Auth onLogin={handleLogin} />
  }

  return <MindMap user={user} onLogout={handleLogout} />
}

export default App