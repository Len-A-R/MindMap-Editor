import { v4 as uuidv4 } from 'uuid'

export const generateId = () => uuidv4()

export const createNode = (parentNode, text = 'Новый узел', overrides = {}) => ({
  id: generateId(),
  text,
  x: parentNode ? parentNode.x + 200 : window.innerWidth / 2,
  y: parentNode ? parentNode.y : window.innerHeight / 2,
  parentId: parentNode?.id || null,
  isDetached: false,
  collapsed: false,
  order: 0,
  style: {},
  ...overrides
})

export const createRootNode = (text = 'Центральная тема') => createNode(null, text, {
  x: window.innerWidth / 2,
  y: window.innerHeight / 2,
  style: {
    backgroundColor: '#3b82f6',
    borderColor: '#60a5fa',
    width: 180,
    fontSize: 16,
    fontWeight: '600'
  }
})

export const duplicateNode = (node, newParentId = null) => ({
  ...node,
  id: generateId(),
  parentId: newParentId,
  x: node.x + 50,
  y: node.y + 50
})

export const getNodeCenter = (node) => ({
  x: node.x,
  y: node.y
})

export const getDistance = (node1, node2) => {
  const dx = node1.x - node2.x
  const dy = node1.y - node2.y
  return Math.sqrt(dx * dx + dy * dy)
}

export const snapToGrid = (value, gridSize = 20) => {
  return Math.round(value / gridSize) * gridSize
}