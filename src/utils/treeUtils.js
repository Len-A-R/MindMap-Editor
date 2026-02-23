/**
 * Convert flat node list to tree structure
 */
export const flatToTree = (nodes) => {
  const nodeMap = new Map()
  const roots = []

  // First pass: create map
  nodes.forEach(node => {
    nodeMap.set(node.id, { ...node, children: [] })
  })

  // Second pass: build tree
  nodes.forEach(node => {
    const treeNode = nodeMap.get(node.id)
    if (node.parentId && nodeMap.has(node.parentId)) {
      const parent = nodeMap.get(node.parentId)
      parent.children.push(treeNode)
    } else {
      roots.push(treeNode)
    }
  })

  return roots
}

/**
 * Convert tree to flat list
 */
export const treeToFlat = (roots) => {
  const result = []
  
  const traverse = (node, parentId = null) => {
    const { children, ...nodeData } = node
    const flatNode = { ...nodeData, parentId }
    result.push(flatNode)
    
    if (children) {
      children.forEach(child => traverse(child, node.id))
    }
  }
  
  roots.forEach(root => traverse(root))
  return result
}

/**
 * Get all descendants of a node
 */
export const getDescendants = (nodes, nodeId) => {
  const descendants = []
  const children = nodes.filter(n => n.parentId === nodeId)
  
  children.forEach(child => {
    descendants.push(child.id)
    descendants.push(...getDescendants(nodes, child.id))
  })
  
  return descendants
}

/**
 * Get path from node to root
 */
export const getPathToRoot = (nodes, nodeId) => {
  const path = []
  let current = nodes.find(n => n.id === nodeId)
  
  while (current) {
    path.unshift(current.id)
    current = nodes.find(n => n.id === current.parentId)
  }
  
  return path
}

/**
 * Reorder siblings
 */
export const reorderSiblings = (nodes, nodeId, direction) => {
  const node = nodes.find(n => n.id === nodeId)
  if (!node || !node.parentId) return nodes
  
  const siblings = nodes.filter(n => n.parentId === node.parentId)
  const currentIndex = siblings.findIndex(n => n.id === nodeId)
  const newIndex = currentIndex + direction
  
  if (newIndex < 0 || newIndex >= siblings.length) return nodes
  
  // Swap order property
  const updatedNodes = nodes.map(n => {
    if (n.id === nodeId) return { ...n, order: newIndex }
    if (n.id === siblings[newIndex].id) return { ...n, order: currentIndex }
    return n
  })
  
  return updatedNodes.sort((a, b) => (a.order || 0) - (b.order || 0))
}

/**
 * Calculate tree layout (auto-arrange)
 */
export const calculateTreeLayout = (rootNode, nodes, level = 0, siblingIndex = 0, totalSiblings = 1) => {
  const VERTICAL_SPACING = 120
  const HORIZONTAL_SPACING = 200
  
  const x = level * HORIZONTAL_SPACING
  const y = (siblingIndex - (totalSiblings - 1) / 2) * VERTICAL_SPACING
  
  const updatedRoot = { ...rootNode, x, y }
  const children = nodes.filter(n => n.parentId === rootNode.id && !n.isDetached)
  
  const updatedChildren = children.map((child, idx) => 
    calculateTreeLayout(child, nodes, level + 1, idx, children.length)
  )
  
  return { node: updatedRoot, children: updatedChildren }
}