import { useState, useEffect } from 'react'

const USERS_KEY = 'mindmap_users'

export const useAuth = () => {
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    const saved = localStorage.getItem('mindmap_current_user')
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved))
      } catch (e) {
        localStorage.removeItem('mindmap_current_user')
      }
    }
  }, [])

  const getUsers = () => {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]')
  }

  const saveUsers = (users) => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
  }

  const login = (username, password) => {
    const users = getUsers()
    const user = users.find(u => u.username === username && u.password === password)
    
    if (user) {
      localStorage.setItem('mindmap_current_user', JSON.stringify(user))
      setCurrentUser(user)
      return { success: true, user }
    }
    
    return { success: false, error: 'Неверные данные' }
  }

  const register = (username, password) => {
    const users = getUsers()
    
    if (users.find(u => u.username === username)) {
      return { success: false, error: 'Пользователь существует' }
    }
    
    const newUser = {
      id: generateId(),
      username,
      password,
      createdAt: new Date().toISOString()
    }
    
    users.push(newUser)
    saveUsers(users)
    localStorage.setItem('mindmap_current_user', JSON.stringify(newUser))
    setCurrentUser(newUser)
    
    return { success: true, user: newUser }
  }

  const logout = () => {
    localStorage.removeItem('mindmap_current_user')
    setCurrentUser(null)
  }

  return { currentUser, login, register, logout }
}

const generateId = () => Math.random().toString(36).substr(2, 9)