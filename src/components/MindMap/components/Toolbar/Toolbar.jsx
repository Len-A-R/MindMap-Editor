import React from 'react'
import { Button } from '@components/common/Button'
import { Icon } from '@components/common/Icon'
import { saveToFile, loadFromFile } from '@utils/fileUtils'
import styles from './Toolbar.module.css'

const Toolbar = ({ mindMap, user, onLogout }) => {
  const {
    selectedNodes,
    addChildNode,
    addNode,
    deleteSelectedNodes,
    toggleDetached,
    isConnecting,
    setIsConnecting,
    setConnectStart,
    scale,
    setScale,
    offset,
    setOffset,
    canUndo,
    canRedo,
    undo,
    redo,
    nodes,
    connections,
    setNodes,
    setConnections
  } = mindMap

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
        addNode()
      }
    } else {
      addNode()
    }
  }

  const handleConnection = () => {
    if (selectedNodes.length === 1) {
      setIsConnecting(!isConnecting)
      setConnectStart(isConnecting ? null : selectedNodes[0])
    }
  }

  const handleSave = () => {
    const data = {
      version: '2.0',
      timestamp: new Date().toISOString(),
      nodes,
      connections,
      user: user.username
    }
    saveToFile(data, `mindmap_${user.username}_${new Date().toISOString().split('T')[0]}.json`)
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
            <Icon name="Network" size={20} className="text-white" />
          </div>
          <span className={styles.logoText}>MindMap Editor</span>
        </div>

        <div className={styles.divider} />

        <div className={styles.tools}>
          <Button
            icon="Plus"
            onClick={handleAddChild}
            disabled={selectedNodes.length !== 1}
            title="Добавить дочерний узел (выберите родителя)"
            variant={selectedNodes.length === 1 ? 'default' : 'ghost'}
          />
          
          <Button
            icon="GitCommit"
            onClick={handleAddSibling}
            title="Добавить соседний узел"
          />
          
          <Button
            icon="Trash2"
            onClick={deleteSelectedNodes}
            disabled={selectedNodes.length === 0}
            variant="danger"
            title="Удалить выбранные (Delete)"
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
            title="Открепить/прикрепить узел от родителя"
          />

          <div className={styles.divider} />

          <Button
            icon="Undo2"
            onClick={undo}
            disabled={!canUndo}
            title="Отменить (Ctrl+Z)"
          />
          
          <Button
            icon="Redo2"
            onClick={redo}
            disabled={!canRedo}
            title="Повторить (Ctrl+Shift+Z)"
          />
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.zoom}>
          <Button icon="ZoomOut" onClick={zoomOut} size="sm" />
          <span className={styles.zoomValue}>{Math.round(scale * 100)}%</span>
          <Button icon="ZoomIn" onClick={zoomIn} size="sm" />
          <Button icon="Maximize" onClick={resetView} size="sm" title="Сбросить вид" />
          <Button icon="Scan" onClick={fitToScreen} size="sm" title="Вписать в экран" />
        </div>

        <div className={styles.divider} />

        <Button icon="Download" onClick={handleSave} variant="primary">
          Сохранить
        </Button>
        
        <Button icon="Upload" onClick={handleLoad}>
          Загрузить
        </Button>

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