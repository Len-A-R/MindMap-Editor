import React, { useState } from 'react'
import { useMindMap } from './hooks/useMindMap.js'
import Canvas from './components/Canvas/Canvas.jsx'
import Toolbar from './components/Toolbar/Toolbar.jsx'
import PropertiesPanel from './components/PropertiesPanel/PropertiesPanel.jsx'
import MiniMap from './components/MiniMap/MiniMap.jsx'
import { Icon } from '@components/common/Icon.jsx'
import styles from './MindMap.module.css'
import Connections from './components/Connections/Connections.jsx'

const MindMap = ({ user, onLogout }) => {
  const mindMap = useMindMap(user)
  const [showHelp, setShowHelp] = useState(true)

  return (
    <div className={styles.container}>
      <Toolbar mindMap={mindMap} user={user} onLogout={onLogout} />
      
      <div className={styles.main}>
        <Canvas mindMap={mindMap} />

        {/* Миникарта слева выше статус бара */}
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

        {/* Статус бар слева внизу */}
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
          </div>
        </div>

        <Connections 
          nodes={mindMap.nodes} 
          connections={mindMap.connections} 
          selectedConnection={mindMap.selectedConnection}
          onSelectConnection={mindMap.setSelectedConnection}
          isConnecting={mindMap.isConnecting}
          connectStart={mindMap.connectStart}
        />
        
        {/* Панель свойств для узла ИЛИ связи */}
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
        
        {/* Подсказки справа на уровне статус бара */}
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
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MindMap