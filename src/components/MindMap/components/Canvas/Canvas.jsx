import React, { useRef, useCallback, useEffect } from 'react'
import Node from '../Node/Node.jsx'
import Connections from '../Connections/Connections.jsx'
import styles from './Canvas.module.css'

const Canvas = ({ mindMap }) => {
  const canvasRef = useRef(null)
  
  const {
    nodes,
    connections,
    selectedNodes,
    editingNode,
    deleteSelectedNodes,
    scale,
    offset,
    setOffset,
    setSelectedNodes,
    setEditingNode,
    updateNode,
    addChildNode,
    startDrag,
    drag,
    endDrag,
    addConnection,
    isConnecting,
    setIsConnecting,
    connectStart,
    setConnectStart,
    selectedConnection,
    setSelectedConnection,
    deleteConnection,
    updateConnection
  } = mindMap

  const [isPanning, setIsPanning] = React.useState(false)
  const [panStart, setPanStart] = React.useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = React.useState(false)
  const [draggedNodeId, setDraggedNodeId] = React.useState(null)

  // Проверяем, что клик был на пустой области канвы (не на узле)
  const isClickOnEmptyCanvas = (e) => {
    // Проверяем, что target - это сам canvas или его не-интерактивные дочерние элементы
    const target = e.target
    const isCanvas = target === canvasRef.current
    const isSvg = target.tagName === 'svg'
    const isConnectionLine = target.tagName === 'line' || target.tagName === 'path'
    const isViewport = target.classList && target.classList.contains(styles.viewport)
    
    return isCanvas || isSvg || isConnectionLine || isViewport
  }

  const handleMouseDown = useCallback((e) => {
    // Левый клик (0) только
    if (e.button !== 0) return
    
    if (!isClickOnEmptyCanvas(e)) {
      // Клик на узле или другом интерактивном элементе
      return
    }

    if (isConnecting) {
      setIsConnecting(false)
      setConnectStart(null)
      return
    }
    
    setIsPanning(true)
    setPanStart({ x: e.clientX - offset.x, y: e.clientY - offset.y })
    setSelectedNodes([])
    setSelectedConnection(null)
  }, [offset, isConnecting, setIsConnecting, setConnectStart, setSelectedNodes])

  const handleMouseMove = useCallback((e) => {
    if (isPanning) {
      setOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      })
      return
    }
    
    if (isDragging && draggedNodeId) {
      drag(e.clientX, e.clientY, true)
    }
  }, [isPanning, panStart, setOffset, isDragging, draggedNodeId, drag])

  const handleMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false)
    }
    
    if (isDragging) {
      endDrag()
      setIsDragging(false)
      setDraggedNodeId(null)
    }
  }, [isPanning, isDragging, endDrag])

  const handleWheel = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? 0.9 : 1.1
      mindMap.setScale(s => Math.max(0.3, Math.min(3, s * delta)))
    }
  }, [mindMap])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        if (selectedConnection) {
          deleteConnection(selectedConnection)
        } else {
          deleteSelectedNodes()
        }
      }
    }
    const canvas = canvasRef.current
    if (canvas) {
      canvas.addEventListener('wheel', handleWheel, { passive: false })
      return () => canvas.removeEventListener('wheel', handleWheel)
    }
  }, [handleWheel, selectedConnection, deleteConnection, deleteSelectedNodes])

  const handleNodeClick = useCallback((nodeId) => {
    if (isConnecting && connectStart && connectStart !== nodeId) {
      addConnection(connectStart, nodeId)
      setIsConnecting(false)
      setConnectStart(null)
    } else {
      setSelectedNodes([nodeId])
    }
  }, [isConnecting, connectStart, addConnection, setIsConnecting, setConnectStart, setSelectedNodes])

  const handleNodeStartDrag = useCallback((e, nodeId) => {
    if (editingNode) return
    
    e.stopPropagation()
    e.preventDefault()
    
    setSelectedNodes([nodeId])
    setDraggedNodeId(nodeId)
    setIsDragging(true)
    setIsPanning(false) // Гарантируем, что pan не активен
    
    startDrag(nodeId, e.clientX, e.clientY)
  }, [editingNode, setSelectedNodes, startDrag])

  return (
    <div
      ref={canvasRef}
      className={`${styles.canvas} ${isPanning ? styles.panning : ''} ${isDragging ? styles.dragging : ''}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        className={styles.viewport}
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transformOrigin: '0 0'
        }}
      >
        <Connections 
          nodes={nodes} 
          connections={connections} 
          isConnecting={isConnecting}
          connectStart={connectStart}
        />
        
        {nodes.map(node => (
          <Node
            key={node.id}
            node={node}
            isSelected={selectedNodes.includes(node.id)}
            isEditing={editingNode === node.id}
            isConnecting={isConnecting && connectStart === node.id}
            onSelect={handleNodeClick}
            onUpdate={updateNode}
            onStartDrag={handleNodeStartDrag}
            onStartEdit={setEditingNode}
            onFinishEdit={(id, text) => {
              setEditingNode(null)
              updateNode(id, { text })
            }}
            onAddChild={addChildNode}
            scale={scale}
          />
        ))}
      </div>
    </div>
  )
}

export default Canvas