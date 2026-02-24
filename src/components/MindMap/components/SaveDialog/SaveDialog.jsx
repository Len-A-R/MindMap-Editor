import React, { useState, useEffect } from 'react'
import { Icon } from '@components/common/Icon.jsx'
import styles from './SaveDialog.module.css'

const SaveDialog = ({ isOpen, onSave, onCancel, defaultName = '' }) => {
  const [name, setName] = useState(defaultName)

  useEffect(() => {
    if (isOpen) {
      setName(defaultName)
    }
  }, [isOpen, defaultName])

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (name.trim()) {
      onSave(name.trim())
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        <div className={styles.header}>
          <Icon name="Save" size={24} />
          <h3>Сохранить карту</h3>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label>Название карты:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Введите название..."
              autoFocus
              className={styles.input}
            />
          </div>
          
          <div className={styles.buttons}>
            <button type="button" className={styles.cancelBtn} onClick={onCancel}>
              Отмена
            </button>
            <button type="submit" className={styles.saveBtn} disabled={!name.trim()}>
              <Icon name="Save" size={16} />
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SaveDialog