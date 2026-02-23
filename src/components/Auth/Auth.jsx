import React, { useState, useEffect } from 'react'
import { Icon } from '@components/common/Icon'
import styles from './Auth.module.css'

const Auth = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('mindmap_current_user')
    if (saved) {
      try {
        onLogin(JSON.parse(saved))
      } catch (e) {
        localStorage.removeItem('mindmap_current_user')
      }
    }
  }, [onLogin])

  const validate = () => {
    if (!username.trim() || !password.trim()) {
      setError('Заполните все поля')
      return false
    }
    if (username.length < 3) {
      setError('Имя пользователя минимум 3 символа')
      return false
    }
    if (password.length < 4) {
      setError('Пароль минимум 4 символа')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!validate()) return
    
    setIsLoading(true)
    
    // Имитировать задержку API
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const users = JSON.parse(localStorage.getItem('mindmap_users') || '[]')
    
    if (isLogin) {
      const user = users.find(u => u.username === username && u.password === password)
      if (user) {
        localStorage.setItem('mindmap_current_user', JSON.stringify(user))
        onLogin(user)
      } else {
        setError('Неверное имя пользователя или пароль')
      }
    } else {
      if (users.find(u => u.username === username)) {
        setError('Пользователь с таким именем уже существует')
      } else {
        const newUser = {
          id: Math.random().toString(36).substr(2, 9),
          username,
          password,
          createdAt: new Date().toISOString()
        }
        users.push(newUser)
        localStorage.setItem('mindmap_users', JSON.stringify(users))
        localStorage.setItem('mindmap_current_user', JSON.stringify(newUser))
        onLogin(newUser)
      }
    }
    
    setIsLoading(false)
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <div className={styles.iconWrapper}>
            <Icon name="Network" size={32} className="text-white" />
          </div>
          <h1 className={styles.title}>MindMap Editor</h1>
          <p className={styles.subtitle}>От хаоса к структуре.</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <Icon name="User" size={18} className={styles.inputIcon} />
            <input
              type="text"
              placeholder="Имя пользователя"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={styles.input}
              disabled={isLoading}
            />
          </div>

          <div className={styles.inputGroup}>
            <Icon name="Lock" size={18} className={styles.inputIcon} />
            <input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className={styles.error}>
              <Icon name="AlertCircle" size={16} />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={styles.submitBtn}
          >
            {isLoading ? (
              <Icon name="Loader2" size={20} className="animate-spin" />
            ) : (
              isLogin ? 'Войти' : 'Создать аккаунт'
            )}
          </button>
        </form>

        <div className={styles.switch}>
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin)
              setError('')
            }}
            className={styles.switchBtn}
          >
            {isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
          </button>
        </div>

        <div className={styles.hint}>
          <Icon name="Info" size={14} />
          <span>Данные хранятся локально в вашем браузере</span>
        </div>
      </div>
    </div>
  )
}

export default Auth