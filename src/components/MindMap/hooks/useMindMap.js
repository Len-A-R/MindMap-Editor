import { useState, useCallback, useEffect, useRef } from 'react'
import { useStorage } from './useStorage.js'
import { useHistory } from './useHistory.js'
import { createNode, createRootNode, generateId } from '@utils/nodeUtils.js'
import { getDescendants, flatToTree } from '@utils/treeUtils.js'
import { defaultNodeStyle } from '@constants/defaultStyles.js'

export const useMindMap = (user) => {
  const { saveData, loadData } = useStorage(user.id)
  
  const initialState = useCallback(() => {
    const loaded = loadData()
    if (loaded && loaded.nodes.length > 0) {
      return {
        nodes: loaded.nodes,
        connections: loaded.connections || []
      }
    }
    return {
      nodes: [createRootNode()],
      connections: []
    }
  }, [loadData])

  const { 
    state, 
    pushState, 
    undo, 
    redo, 
    canUndo, 
    canRedo 
  } = useHistory(initialState())

  const [selectedNodes, setSelectedNodes] = useState([])
  const [editingNode, setEditingNode] = useState(null)
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectStart, setConnectStart] = useState(null)
  const [clipboard, setClipboard] = useState(null)
  const dragStateRef = useRef(null)
  const [dragNodes, setDragNodes] = useState(null)
  const [selectedConnection, setSelectedConnection] = useState(null)

  // Auto-save
  useEffect(() => {
    const timer = setTimeout(() => {
      saveData(state.nodes, state.connections)
    }, 1000)
    return () => clearTimeout(timer)
  }, [state, saveData])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Если в режиме редактирования
      if (editingNode) {
        // // Tab в режиме редактирования - стандартное поведение (вставка табуляции)
        // // Но можно перехватить если нужно
        // if (e.key === 'Tab') {
        //   // Позволяем Tab работать как обычно в contentEditable
        //   return
        // }
        
        // // Shift+Enter - новая строка (стандартное поведение contentEditable)
        // // Enter без Shift - выход из редактирования
        // if (e.key === 'Enter' && !e.shiftKey) {
        //   e.preventDefault()
        //   setEditingNode(null)
        // }
        // // Escape - выход без сохранения (или с сохранением)
        // if (e.key === 'Escape') {
        //   setEditingNode(null)
        // }
        return
      } 

      // Не в режиме редактирования
      if (e.key === 'Tab') {
        e.preventDefault()
        // Создать дочерний узел
        if (selectedNodes.length === 1) {
          addChildNode(selectedNodes[0])
        } else if (selectedNodes.length === 0 && state.nodes.length > 0) {
          // Если ничего не выбрано, создаём дочерний у первого корневого узла
          const rootNode = state.nodes.find(n => !n.parentId)
          if (rootNode) {
            addChildNode(rootNode.id)
          }
        }
        return
      }

      if (e.key === 'Enter') {
        e.preventDefault()
        // Создать соседний узел
        if (selectedNodes.length === 1) {
          const selected = state.nodes.find(n => n.id === selectedNodes[0])
          if (selected && selected.parentId) {
            addChildNode(selected.parentId)
          } else {
            // Если корневой или нет родителя - создать дочерний
            addChildNode(selectedNodes[0])
          }
        } else {
          // Если ничего не выбрано - создать корневой узел
          addNode()
        }
        return
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        deleteSelectedNodes()
      }
      
      if (e.key === 'F2' && selectedNodes.length === 1) {
        e.preventDefault()
        setEditingNode(selectedNodes[0])
      }
      
      // Навигация стрелками
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault()
        navigateWithArrow(e.key)
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        if (e.shiftKey) {
          const newState = redo()
          if (newState) {
            pushState(newState)
          }
        } else {
          undo()
        }
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault()
        copySelected()
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault()
        pasteClipboard()
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
        e.preventDefault()
        cutSelected()
      }
    }

    const navigateWithArrow = (key) => {
      if (selectedNodes.length !== 1) return
      
      const currentId = selectedNodes[0]
      const current = state.nodes.find(n => n.id === currentId)
      if (!current) return

      let target = null

      switch (key) {
        case 'ArrowRight':
          // Ищем дочерние узлы справа
          const children = state.nodes.filter(n => 
            n.parentId === currentId && !n.isDetached
          ).sort((a, b) => a.y - b.y)
          if (children.length > 0) {
            target = children[0]
          }
          break

        case 'ArrowLeft':
          // Ищем родителя слева
          if (current.parentId && !current.isDetached) {
            target = state.nodes.find(n => n.id === current.parentId)
          }
          break

        case 'ArrowDown':
        case 'ArrowUp':
          // Ищем соседей по вертикали
          const siblings = state.nodes.filter(n => 
            n.parentId === current.parentId && n.id !== currentId
          ).sort((a, b) => a.y - b.y)
          
          if (siblings.length === 0) break
          
          const currentIndex = siblings.findIndex(n => n.y > current.y)
          
          if (key === 'ArrowDown') {
            // Следующий снизу
            if (currentIndex >= 0) {
              target = siblings[currentIndex]
            } else if (siblings.length > 0) {
              target = siblings[0]
            }
          } else {
            // ArrowUp - предыдущий сверху
            const prevIndex = siblings.findIndex(n => n.y >= current.y) - 1
            if (prevIndex >= 0) {
              target = siblings[prevIndex]
            } else if (siblings.length > 0) {
              target = siblings[siblings.length - 1]
            }
          }
          break
      }

      if (target) {
        setSelectedNodes([target.id])
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedNodes, editingNode, undo, redo, clipboard, state.nodes, pushState])

  const addNode = useCallback((parentId = null, text = 'Новый узел') => {
    const parent = parentId ? state.nodes.find(n => n.id === parentId) : null
    const newNode = createNode(parent, text)
    
    if (!parentId) {
      const centerX = (-offset.x + window.innerWidth / 2) / scale
      const centerY = (-offset.y + window.innerHeight / 2) / scale
      newNode.x = centerX
      newNode.y = centerY
    }
    
    const newState = {
      nodes: [...state.nodes, newNode],
      connections: state.connections
    }
    
    pushState(newState)
    setSelectedNodes([newNode.id])
    return newNode.id
  }, [state, offset, scale, pushState])

  const addChildNode = useCallback((parentId) => {
    const parent = state.nodes.find(n => n.id === parentId)
    if (!parent) return
    
    const children = state.nodes.filter(n => n.parentId === parentId && !n.isDetached)
    const angle = (children.length * 45) * (Math.PI / 180)
    const distance = 150
    
    const newNode = createNode(parent, 'Новый узел', {
      x: parent.x + Math.cos(angle) * distance,
      y: parent.y + Math.sin(angle) * distance
    })
    
    const newState = {
      nodes: [...state.nodes, newNode],
      connections: state.connections
    }
    
    pushState(newState)
    setSelectedNodes([newNode.id])
    setEditingNode(newNode.id)
  }, [state.nodes, pushState])

  const updateNode = useCallback((nodeId, updates) => {
    const newNodes = state.nodes.map(n => 
      n.id === nodeId ? { ...n, ...updates } : n
    )
    pushState({ ...state, nodes: newNodes })
  }, [state, pushState])

  const updateNodesStyle = useCallback((nodeIds, styleUpdates) => {
    const newNodes = state.nodes.map(n => 
      nodeIds.includes(n.id) 
        ? { ...n, style: { ...n.style, ...styleUpdates } }
        : n
    )
    pushState({ ...state, nodes: newNodes })
  }, [state, pushState])

const deleteSelectedNodes = useCallback(() => {
  if (selectedNodes.length === 0) return
  
  const idsToDelete = new Set(selectedNodes)
  const rootNode = state.nodes.find(n => !n.parentId)
  
  let shouldBreak = false
  for (const id of selectedNodes) {
    if (id === rootNode?.id) {
      shouldBreak = true
      break // Прерываем for...of, не forEach!
    }
    getDescendants(state.nodes, id).forEach(descId => idsToDelete.add(descId))
  }
  
  if (shouldBreak) return // Выходим из функции

  const newNodes = state.nodes.filter(n => !idsToDelete.has(n.id))
  const newConnections = state.connections.filter(c => 
    !idsToDelete.has(c.from) && !idsToDelete.has(c.to)
  )
  
  pushState({ nodes: newNodes, connections: newConnections })
  setSelectedNodes([])
}, [selectedNodes, state, pushState])

  const startDrag = useCallback((nodeId, mouseX, mouseY) => {
    const node = state.nodes.find(n => n.id === nodeId)
    if (!node) return
    
    dragStateRef.current = {
      nodeId,
      startMouseX: mouseX,
      startMouseY: mouseY,
      startNodeX: node.x,
      startNodeY: node.y,
      initialNodes: state.nodes.map(n => ({...n})),
      hasMoved: false
    }
  }, [state.nodes])

  const drag = useCallback((mouseX, mouseY, moveChildren = true) => {
    if (!dragStateRef.current) return
    
    const { 
      nodeId, 
      startMouseX, 
      startMouseY, 
      startNodeX, 
      startNodeY, 
      initialNodes 
    } = dragStateRef.current
    
    const dx = (mouseX - startMouseX) / scale
    const dy = (mouseY - startMouseY) / scale
    
    const newX = startNodeX + dx
    const newY = startNodeY + dy
    
    const draggedNode = initialNodes.find(n => n.id === nodeId)
    const nodeDx = newX - draggedNode.x
    const nodeDy = newY - draggedNode.y
    
    const newNodes = initialNodes.map(n => {
      if (n.id === nodeId) {
        return { ...n, x: newX, y: newY }
      }
      if (moveChildren && !draggedNode.isDetached && n.parentId === nodeId) {
        return { ...n, x: n.x + nodeDx, y: n.y + nodeDy }
      }
      return n
    })
    
    setDragNodes(newNodes)
    dragStateRef.current.hasMoved = true
  }, [scale])

  const endDrag = useCallback(() => {
    if (!dragStateRef.current?.hasMoved) {
      dragStateRef.current = null
      setDragNodes(null)
      return
    }
    
    if (dragNodes) {
      pushState({ ...state, nodes: dragNodes })
    }
    
    dragStateRef.current = null
    setDragNodes(null)
  }, [dragNodes, state, pushState])

  const toggleDetached = useCallback((nodeId) => {
    const node = state.nodes.find(n => n.id === nodeId)
    if (!node) return
    
    updateNode(nodeId, { isDetached: !node.isDetached })
  }, [state.nodes, updateNode])

  const addConnection = useCallback((fromId, toId) => {
    const exists = state.connections.find(c => 
      (c.from === fromId && c.to === toId) || 
      (c.from === toId && c.to === fromId)
    )
    
    if (exists || fromId === toId) return
    
    const newConnection = {
      id: generateId(),
      from: fromId,
      to: toId,
      style: { color: '#f59e0b', width: 2, dashed: true }
    }
    
    pushState({
      ...state,
      connections: [...state.connections, newConnection]
    })
  }, [state, pushState])

  const removeConnection = useCallback((connectionId) => {
    pushState({
      ...state,
      connections: state.connections.filter(c => c.id !== connectionId)
    })
  }, [state, pushState])

  const copySelected = useCallback(() => {
    if (selectedNodes.length === 0) return
    
    const nodesToCopy = state.nodes.filter(n => selectedNodes.includes(n.id))
    const connectionsToCopy = state.connections.filter(c => 
      selectedNodes.includes(c.from) && selectedNodes.includes(c.to)
    )
    
    setClipboard({
      nodes: nodesToCopy,
      connections: connectionsToCopy,
      timestamp: Date.now()
    })
  }, [selectedNodes, state])

  const pasteClipboard = useCallback(() => {
    if (!clipboard || !clipboard.nodes.length) return
    
    const idMap = new Map()
    const newNodes = clipboard.nodes.map(node => {
      const newId = generateId()
      idMap.set(node.id, newId)
      return {
        ...node,
        id: newId,
        parentId: node.parentId && idMap.has(node.parentId) ? idMap.get(node.parentId) : null,
        x: node.x + 50,
        y: node.y + 50
      }
    })
    
    const newConnections = clipboard.connections.map(conn => ({
      ...conn,
      id: generateId(),
      from: idMap.get(conn.from),
      to: idMap.get(conn.to)
    }))
    
    pushState({
      nodes: [...state.nodes, ...newNodes],
      connections: [...state.connections, ...newConnections]
    })
    
    setSelectedNodes(newNodes.map(n => n.id))
  }, [clipboard, state, pushState])

  const cutSelected = useCallback(() => {
    copySelected()
    deleteSelectedNodes()
  }, [copySelected, deleteSelectedNodes])

  const setNodes = useCallback((nodesOrUpdater) => {
    const newNodes = typeof nodesOrUpdater === 'function' 
      ? nodesOrUpdater(state.nodes)
      : nodesOrUpdater
    pushState({ ...state, nodes: newNodes })
  }, [state, pushState])

  const setConnections = useCallback((connectionsOrUpdater) => {
    const newConnections = typeof connectionsOrUpdater === 'function'
      ? connectionsOrUpdater(state.connections)
      : connectionsOrUpdater
    pushState({ ...state, connections: newConnections })
  }, [state, pushState])

    // ... функция удаления связи
  const deleteConnection = useCallback((connectionId) => {
    pushState({
      ...state,
      connections: state.connections.filter(c => c.id !== connectionId)
    })
    setSelectedConnection(null)
  }, [state, pushState])

  // ... функция обновления связи (текст, стиль)
  const updateConnection = useCallback((connectionId, updates) => {
    const newConnections = state.connections.map(c => 
      c.id === connectionId ? { ...c, ...updates } : c
    )
    pushState({ ...state, connections: newConnections })
  }, [state, pushState])

  const currentNodes = dragNodes || state.nodes

  return {
    nodes: currentNodes,
    connections: state.connections,
    selectedNodes,
    editingNode,
    scale,
    offset,
    isConnecting,
    connectStart,
    canUndo,
    canRedo,
    setSelectedNodes,
    setEditingNode,
    setScale,
    setOffset,
    setIsConnecting,
    setConnectStart,
    addNode,
    addChildNode,
    updateNode,
    updateNodesStyle,
    deleteSelectedNodes,
    startDrag,
    drag,
    endDrag,
    toggleDetached,
    addConnection,
    removeConnection,
    copySelected,
    pasteClipboard,
    cutSelected,
    undo,
    redo,
    setNodes,
    setConnections,
    selectedConnection,
    setSelectedConnection    
  }
}