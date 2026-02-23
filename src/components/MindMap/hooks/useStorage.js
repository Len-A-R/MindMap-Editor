import { useCallback } from 'react'
import { flatToTree, treeToFlat } from '@utils/treeUtils'

const getStorageKey = (userId, type = 'data') => `mindmap_${type}_${userId}`

export const useStorage = (userId) => {
  const saveData = useCallback((nodes, connections) => {
    // Преобразовать в древовидную структуру для хранения
    const treeData = flatToTree(nodes)
    const data = {
      version: '2.0',
      timestamp: new Date().toISOString(),
      tree: treeData,
      connections,
      metadata: {
        nodeCount: nodes.length,
        connectionCount: connections.length
      }
    }
    localStorage.setItem(getStorageKey(userId), JSON.stringify(data))
  }, [userId])

  const loadData = useCallback(() => {
    const saved = localStorage.getItem(getStorageKey(userId))
    if (!saved) return null
    
    try {
      const data = JSON.parse(saved)
      
      // Обрабатка устаревшего плоского формата
      if (!data.version && Array.isArray(data)) {
        return { nodes: data, connections: [] }
      }
      
      // Преобразовать дерево обратно в плоское
      const nodes = treeToFlat(data.tree || [])
      return {
        nodes,
        connections: data.connections || [],
        metadata: data.metadata
      }
    } catch (e) {
      console.error('Failed to load data:', e)
      return null
    }
  }, [userId])

  const exportData = useCallback(() => {
    const data = localStorage.getItem(getStorageKey(userId))
    return data ? JSON.parse(data) : null
  }, [userId])

  const importData = useCallback((data) => {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(data))
  }, [userId])

  const clearData = useCallback(() => {
    localStorage.removeItem(getStorageKey(userId))
    localStorage.removeItem(getStorageKey(userId, 'connections'))
  }, [userId])

  return { saveData, loadData, exportData, importData, clearData }
}