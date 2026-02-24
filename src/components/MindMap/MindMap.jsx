import React, { useState, useRef, useEffect } from 'react'
import { useMindMap } from './hooks/useMindMap.js'
import Canvas from './components/Canvas/Canvas.jsx'
import Toolbar from './components/Toolbar/Toolbar.jsx'
import PropertiesPanel from './components/PropertiesPanel/PropertiesPanel.jsx'
import MiniMap from './components/MiniMap/MiniMap.jsx'
import MapCatalog from './components/MapCatalog/MapCatalog.jsx'
import SaveDialog from './components/SaveDialog/SaveDialog.jsx'
import { exportMindMapToPNG } from '@utils/fileUtils.js'
import { Icon } from '@components/common/Icon.jsx'
import styles from './MindMap.module.css'

const MindMap = ({ user, onLogout }) => {
  const mindMap = useMindMap(user)
  const [showHelp, setShowHelp] = useState(true)
  const [catalogOpen, setCatalogOpen] = useState(false)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false) // Флаг успешного сохранения
  const canvasRef = useRef(null)

 // Обработка Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's' && !e.shiftKey) {
        e.preventDefault()
        // Открываем диалог сохранения с новым именем
        setSaveDialogOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Автоматически скрывать сообщение об успехе через 2 секунды
  useEffect(() => {
    if (saveSuccess) {
      const timer = setTimeout(() => setSaveSuccess(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [saveSuccess])

  const handleExportPNG = () => {
    exportMindMapToPNG(canvasRef.current, `mindmap_${new Date().toISOString().split('T')[0]}.png`)
  }

  // Сохранение с именем (Ctrl+S)
  const handleSaveWithName = (name) => {
    console.log('mindMap object:', mindMap)
    console.log('createMapWithData:', mindMap.createMapWithData)
    console.log('Available methods:', Object.keys(mindMap))
    
    if (!name || !name.trim()) {
      alert('Введите название карты')
      return
    }

    try {
      // Создаем карту И СРАЗУ сохраняем текущие данные
      const newId = mindMap.createMapWithData(name.trim(), mindMap.nodes, mindMap.connections)
      
      if (newId) {
        console.log('Map saved successfully, id:', newId)
        setSaveDialogOpen(false)
        setSaveSuccess(true)
      } else {
        alert('Ошибка при создании карты')
      }
    } catch (error) {
      console.error('Error saving map:', error)
      alert('Ошибка сохранения: ' + error.message)
    }
  }

  // Обработчик переключения карты
  const handleSwitchMap = (id) => {
    console.log('Switching to map:', id)
    
    // Сначала переключаем ID
    mindMap.switchMap(id)
    
    // Затем загружаем данные
    const success = mindMap.loadMap(id)
    
    if (success) {
      setCatalogOpen(false)
    } else {
      alert('Ошибка загрузки карты')
    }
  }  

  if (!mindMap.isLoaded) {
    return (
      <div className={styles.loading}>
        <Icon name="Loader2" size={32} className={styles.spinner} />
        <span>Загрузка...</span>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {/* Уведомление об успешном сохранении */}
      {saveSuccess && (
        <div className={styles.successToast}>
          <Icon name="CheckCircle" size={20} />
          <span>Карта сохранена!</span>
        </div>
      )}

      <Toolbar 
        mindMap={mindMap} 
        user={user} 
        onLogout={onLogout}
        onExportPNG={handleExportPNG}
        onOpenCatalog={() => setCatalogOpen(true)}
        onSaveMap={() => setSaveDialogOpen(true)} // <-- Новый проп
      />

      {/* Диалог сохранения (Ctrl+S) */}
      <SaveDialog
        isOpen={saveDialogOpen}
        onSave={handleSaveWithName}
        onCancel={() => setSaveDialogOpen(false)}
        defaultName={`Карта ${new Date().toLocaleDateString()}`}
      />

      {/* КАТАЛОГ ДОЛЖЕН БЫТЬ ЗДЕСЬ - на том же уровне, что и main, но с position: fixed */}
      {catalogOpen && (
        <MapCatalog
          maps={mindMap.maps}
          currentMapId={mindMap.currentMapId}
          onSwitchMap={handleSwitchMap}
          onCreateMap={mindMap.createMap}
          onDeleteMap={mindMap.deleteMap}
          onRenameMap={mindMap.renameMap}
          onClose={() => setCatalogOpen(false)}
        />
      )}

      <div className={styles.main}>
        <div ref={canvasRef} className={styles.canvasContainer}>
          <Canvas mindMap={mindMap} />
        </div>
        
        <div className={styles.minimapWrapper}>
          <MiniMap 
            nodes={mindMap.nodes}
            connections={mindMap.connections}
            scale={mindMap.scale}
            offset={mindMap.offset}
            onNavigate={(x, y) => mindMap.setOffset({ 
              x: -x * mindMap.scale + window.innerWidth / 2, 
              y: -y * mindMap.scale + window.innerHeight / 2 
            })}
          />
        </div>

        <div className={styles.statusBarWrapper}>
          <div className={styles.statusBarCompact}>
            <div className={styles.statusItem}>
              <Icon name="Layers" size={12} />
              <span>{mindMap.nodes.length}</span>
            </div>
            <div className={styles.divider} />
            <div className={styles.statusItem}>
              <Icon name="GitBranch" size={12} />
              <span>{mindMap.connections.length}</span>
            </div>
            {mindMap.isConnecting && (
              <>
                <div className={styles.divider} />
                <div className={`${styles.statusItem} ${styles.pulse}`}>
                  <Icon name="Link" size={12} />
                  <span>Связь</span>
                </div>
              </>
            )}
            {mindMap.editingNode && (
              <>
                <div className={styles.divider} />
                <div className={`${styles.statusItem} ${styles.editing}`}>
                  <Icon name="Edit3" size={12} />
                  <span>Edit</span>
                </div>
              </>
            )}
            {mindMap.canUndo && (
              <>
                <div className={styles.divider} />
                <div className={styles.statusItem}>
                  <span>Ctrl+Z</span>
                </div>
              </>
            )}
            <div className={styles.divider} />
            <div className={`${styles.statusItem} ${styles.mapName}`}>
              <Icon name="Folder" size={12} />
              <span title={mindMap.maps.find(m => m.id === mindMap.currentMapId)?.name}>
                {mindMap.maps.find(m => m.id === mindMap.currentMapId)?.name || '...'}
              </span>
            </div>
          </div>
        </div>

        {(mindMap.selectedNodes.length > 0 || mindMap.selectedConnection) && (
          <PropertiesPanel 
            selectedNodes={mindMap.selectedNodes}
            selectedConnection={mindMap.selectedConnection}
            nodes={mindMap.nodes}
            connections={mindMap.connections}
            onUpdateNodes={mindMap.updateNodesStyle}
            onUpdateConnection={mindMap.updateConnection}
            onDeleteConnection={mindMap.deleteConnection}
            onClose={() => {
              mindMap.setSelectedNodes([])
              mindMap.setSelectedConnection(null)
            }}
          />
        )}
        
        <div className={styles.helpWrapper}>
          <button 
            className={styles.helpToggle}
            onClick={() => setShowHelp(!showHelp)}
            title={showHelp ? 'Скрыть подсказки' : 'Показать подсказки'}
          >
            <Icon name={showHelp ? 'EyeOff' : 'Eye'} size={14} />
          </button>
          
          {showHelp && (
            <div className={styles.help}>
              <p className={styles.helpTitle}>Горячие клавиши:</p>
              <p><kbd>Tab</kbd> - Дочерний узел</p>
              <p><kbd>Enter</kbd> - Соседний узел</p>
              <p><kbd>F2</kbd> - Редактировать</p>
              <p><kbd>Delete</kbd> - Удалить</p>
              <p><kbd>←↑↓→</kbd> - Навигация</p>
              <p><kbd>Drag</kbd> - Перемещение</p>
              <p><kbd>Ctrl+S</kbd> - Сохранить</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MindMap