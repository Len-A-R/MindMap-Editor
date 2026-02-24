import React, { useState, useRef, useEffect } from 'react'
import { Icon } from '@components/common/Icon.jsx'
import { Button } from '@components/common/Button.jsx'
import { saveToFile, loadFromFile } from '@utils/fileUtils.js'
import styles from './Toolbar.module.css'

const Toolbar = ({ mindMap, user, onLogout, onExportPNG, onOpenCatalog, onSaveMap }) => {
  const [fileMenuOpen, setFileMenuOpen] = useState(false)
  const menuRef = useRef(null)

  const {
    selectedNodes,
    addChildNode,
    deleteSelectedNodes,
    toggleDetached,
    isConnecting,
    setIsConnecting,
    setConnectStart,
    scale,
    setScale,
    offset,
    setOffset,
    nodes,
    connections,
    setNodes,
    setConnections,
    canUndo,
    canRedo,
    undo,
    redo,
    selectedConnection,
    deleteConnection,
    maps
  } = mindMap

  // Закрываем меню при клике вне
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setFileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleAddChild = () => {
    if (selectedNodes.length === 1) {
      addChildNode(selectedNodes[0])
    }
  }

  const handleAddSibling = () => {
    if (selectedNodes.length === 1) {
      const selected = nodes.find(n => n.id === selectedNodes[0])
      if (selected && selected.parentId) {
        addChildNode(selected.parentId)
      } else {
        addChildNode(selectedNodes[0])
      }
    }
  }

  const handleDelete = () => {
    if (selectedConnection) {
      deleteConnection(selectedConnection)
    } else {
      deleteSelectedNodes()
    }
  }

  const handleConnection = () => {
    if (selectedNodes.length === 1) {
      setIsConnecting(!isConnecting)
      setConnectStart(isConnecting ? null : selectedNodes[0])
    }
  }

  // Сохранить в файл (Ctrl+Shift+S)
  const handleSaveToDisk = () => {
    const data = {
      version: '2.0',
      timestamp: new Date().toISOString(),
      nodes,
      connections,
      user: user.username
    }
    saveToFile(data, `mindmap_${user.username}_${new Date().toISOString().split('T')[0]}.json`)
    setFileMenuOpen(false)
  }

  // Сохранить в localStorage (Ctrl+S)
  const handleSaveToStorage = () => {
    onSaveMap()
    setFileMenuOpen(false)
  }

  // Открыть каталог карт (Ctrl+O)
  const handleOpenCatalog = () => {
    onOpenCatalog()
    setFileMenuOpen(false)
  }

  const handleLoad = () => {
    loadFromFile((err, data) => {
      if (err) {
        alert('Ошибка загрузки файла: ' + err.message)
        return
      }
      if (data.nodes) setNodes(data.nodes)
      if (data.connections) setConnections(data.connections)
    })
    setFileMenuOpen(false)
  }

  const handleExport = () => {
    onExportPNG()
    setFileMenuOpen(false)
  }

  const zoomIn = () => setScale(s => Math.min(s * 1.2, 3))
  const zoomOut = () => setScale(s => Math.max(s / 1.2, 0.3))
  
  const resetView = () => {
    setScale(1)
    setOffset({ x: 0, y: 0 })
  }

  const fitToScreen = () => {
    if (nodes.length === 0) return
    const xs = nodes.map(n => n.x)
    const ys = nodes.map(n => n.y)
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)
    const width = maxX - minX + 200
    const height = maxY - minY + 200
    const scaleX = window.innerWidth / width
    const scaleY = window.innerHeight / height
    const newScale = Math.min(scaleX, scaleY, 1)
    setScale(newScale)
    setOffset({
      x: (window.innerWidth - width * newScale) / 2 - minX * newScale + 100 * newScale,
      y: (window.innerHeight - height * newScale) / 2 - minY * newScale + 100 * newScale
    })
  }

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <Icon name="Network" size={20} />
          </div>
          <span className={styles.logoText}>MindMap Pro</span>
        </div>

        <div className={styles.divider} />

        {/* Меню Файл со всеми операциями */}
        <div className={styles.fileMenuWrapper} ref={menuRef}>
          <Button 
            icon="Menu" 
            onClick={() => setFileMenuOpen(!fileMenuOpen)}
            variant={fileMenuOpen ? 'active' : 'default'}
          />
          
          {fileMenuOpen && (
            <div className={styles.fileMenu}>
              {/* Открыть каталог карт (Ctrl+O) */}
              <button onClick={handleOpenCatalog} className={styles.menuItem}>
                <Icon name="FolderOpen" size={16} />
                <span>Открыть</span>
                <kbd>Ctrl+O</kbd>
              </button>
              
              {/* Сохранить в localStorage (Ctrl+S) */}
              <button onClick={handleSaveToStorage} className={styles.menuItem}>
                <Icon name="Save" size={16} />
                <span>Сохранить</span>
                <kbd>Ctrl+S</kbd>
              </button>

              <div className={styles.menuDivider} />
              
              {/* Сохранить в файл (Ctrl+Shift+S) */}
              <button onClick={handleSaveToDisk} className={styles.menuItem}>
                <Icon name="Download" size={16} />
                <span>Сохранить в файл</span>
                <kbd>Ctrl+Shift+S</kbd>
              </button>
              
              {/* Загрузить из файла (Ctrl+Shift+O) */}
              <button onClick={handleLoad} className={styles.menuItem}>
                <Icon name="Upload" size={16} />
                <span>Загрузить из файла</span>
                <kbd>Ctrl+Shift+O</kbd>
              </button>
              
              <div className={styles.menuDivider} />
              
              {/* Экспорт PNG */}
              <button onClick={handleExport} className={styles.menuItem}>
                <Icon name="Image" size={16} />
                <span>Экспорт PNG</span>
              </button>
            </div>
          )}
        </div>

        <div className={styles.divider} />

        <div className={styles.tools}>
          <Button
            icon="Plus"
            onClick={handleAddChild}
            disabled={selectedNodes.length !== 1}
            title="Добавить дочерний узел"
            variant={selectedNodes.length === 1 ? 'default' : 'ghost'}
          />
          
          <Button
            icon="GitCommit"
            onClick={handleAddSibling}
            title="Добавить соседний узел"
          />
          
          <Button
            icon="Trash2"
            onClick={handleDelete}
            disabled={selectedNodes.length === 0 && !selectedConnection}
            variant="danger"
            title="Удалить выбранное"
          />

          <div className={styles.divider} />

          <Button
            icon="Link"
            onClick={handleConnection}
            variant={isConnecting ? 'active' : 'default'}
            disabled={selectedNodes.length !== 1 && !isConnecting}
            title="Создать связь между узлами"
          />
          
          <Button
            icon="Unlink"
            onClick={() => selectedNodes.length === 1 && toggleDetached(selectedNodes[0])}
            disabled={selectedNodes.length !== 1}
            title="Отсоединить/присоединить узел"
          />

          <div className={styles.divider} />

          <Button
            icon="Undo2"
            onClick={undo}
            disabled={!canUndo}
            title="Отменить"
          />
          
          <Button
            icon="Redo2"
            onClick={redo}
            disabled={!canRedo}
            title="Повторить"
          />
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.zoom}>
          <Button icon="ZoomOut" onClick={zoomOut} size="sm" />
          <span className={styles.zoomValue}>{Math.round(scale * 100)}%</span>
          <Button icon="ZoomIn" onClick={zoomIn} size="sm" />
          <Button icon="Maximize" onClick={resetView} size="sm" title="Сбросить вид" />
          <Button icon="Scan" onClick={fitToScreen} size="sm" title="По размеру экрана" />
        </div>

        <div className={styles.divider} />

        <div className={styles.user}>
          <Icon name="User" size={16} />
          <span>{user.username}</span>
          <Button icon="LogOut" onClick={onLogout} size="sm" variant="ghost" title="Выйти" />
        </div>
      </div>
    </header>
  )
}

export default Toolbar