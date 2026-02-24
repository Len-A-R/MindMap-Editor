import React, { useState } from 'react'
import { Icon } from '@components/common/Icon.jsx'
import styles from './MapCatalog.module.css'

const MapCatalog = ({ 
  maps, 
  currentMapId, 
  onSwitchMap, 
  onCreateMap, 
  onDeleteMap, 
  onRenameMap,
  onClose 
}) => {
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [newMapName, setNewMapName] = useState('')

  const handleStartEdit = (map, e) => {
    e.stopPropagation()
    setEditingId(map.id)
    setEditName(map.name)
  }

  const handleSaveEdit = () => {
    if (editingId && editName.trim()) {
      onRenameMap(editingId, editName.trim())
      setEditingId(null)
    }
  }

  const handleCreate = () => {
    const name = newMapName.trim() || 'Новая карта'
    onCreateMap(name)
    setNewMapName('')
  }

  const formatDate = (isoString) => {
    const date = new Date(isoString)
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.header}>
        <h2>
          <Icon name="FolderOpen" size={24} />
          Мои карты ({maps.length})
        </h2>
        <button className={styles.closeBtn} onClick={onClose}>
          <Icon name="X" size={20} />
        </button>
      </div>

      <div className={styles.grid}>
        {maps.map(map => (
          <div 
            key={map.id}
            className={`${styles.card} ${map.id === currentMapId ? styles.active : ''}`}
            onClick={() => onSwitchMap(map.id)}
          >
            <div className={styles.preview}>
              <Icon name="Network" size={40} />
              {map.id === currentMapId && (
                <span className={styles.badge}>Текущая</span>
              )}
            </div>
            
            <div className={styles.info}>
              {editingId === map.id ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={handleSaveEdit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit()
                    if (e.key === 'Escape') setEditingId(null)
                  }}
                  autoFocus
                  className={styles.editInput}
                  onClick={e => e.stopPropagation()}
                />
              ) : (
                <h4 onDoubleClick={(e) => handleStartEdit(map, e)}>
                  {map.name}
                </h4>
              )}
              <span className={styles.date}>
                {formatDate(map.updatedAt)}
              </span>
            </div>

            <div className={styles.actions} onClick={e => e.stopPropagation()}>
              <button 
                className={styles.iconBtn}
                onClick={(e) => handleStartEdit(map, e)}
                title="Переименовать"
              >
                <Icon name="Edit2" size={16} />
              </button>
              {maps.length > 1 && (
                <button 
                  className={`${styles.iconBtn} ${styles.delete}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm(`Удалить карту "${map.name}"?`)) {
                      onDeleteMap(map.id)
                    }
                  }}
                  title="Удалить"
                >
                  <Icon name="Trash2" size={16} />
                </button>
              )}
            </div>
          </div>
        ))}

        <div className={styles.createCard}>
          <div className={styles.createPreview}>
            <Icon name="PlusCircle" size={40} />
          </div>
          <div className={styles.createInfo}>
            <input
              type="text"
              placeholder="Название новой карты..."
              value={newMapName}
              onChange={(e) => setNewMapName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              className={styles.createInput}
            />
            <button className={styles.createBtn} onClick={handleCreate}>
              <Icon name="Plus" size={16} />
              Создать карту
            </button>
          </div>
        </div>
      </div>

      <p className={styles.hint}>
        Двойной клик по названию для переименования • Click для открытия карты
      </p>
    </div>
  )
}

export default MapCatalog