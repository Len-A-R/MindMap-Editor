import { useState, useCallback, useEffect, useRef } from 'react'
import { generateId, createRootNode } from '@utils/nodeUtils.js'

const getCatalogKey = (userId) => `mindmap_catalog_${userId}`
const getMapKey = (userId, mapId) => `mindmap_map_${userId}_${mapId}`

function treeToFlat(tree, parentId = null, result = []) {
  for (const node of tree) {
    const { children, ...nodeData } = node
    const flatNode = { ...nodeData, parentId }
    result.push(flatNode)
    if (children && children.length > 0) {
      treeToFlat(children, node.id, result)
    }
  }
  return result
}

function flatToTree(nodes, parentId = null) {
  return nodes
    .filter(n => n.parentId === parentId)
    .map(n => ({
      ...n,
      children: flatToTree(nodes, n.id)
    }))
}

export const useMapCatalog = (userId) => {
  const [maps, setMaps] = useState([])
  const [currentMapId, setCurrentMapId] = useState(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [pendingSave, setPendingSave] = useState(false) // Флаг для ожидания имени
  
  // Загрузка каталога при инициализации или смене пользователя
  useEffect(() => {
    if (!userId) {
      setMaps([])
      setCurrentMapId(null)
      setIsLoaded(false)
      return
    }
    
    const catalog = localStorage.getItem(getCatalogKey(userId))
    if (catalog) {
      try {
        const parsed = JSON.parse(catalog)
        setMaps(parsed.maps || [])
        setCurrentMapId(parsed.currentMapId)
        setIsLoaded(true)
      } catch (e) {
        console.error('Failed to load catalog:', e)
        createInitialMap()
      }
    } else {
      createInitialMap()
    }
  }, [userId])

  const saveCatalog = useCallback((mapsList, currentId) => {
    const catalog = {
      maps: mapsList,
      currentMapId: currentId,
      updatedAt: new Date().toISOString()
    }
    localStorage.setItem(getCatalogKey(userId), JSON.stringify(catalog))
  }, [userId])

  const createInitialMap = useCallback(() => {
    if (!userId) return
    
    // Проверяем старые данные только при первой инициализации
    const oldData = localStorage.getItem(`mindmap_data_${userId}`)
    const newMap = {
      id: generateId(),
      name: oldData ? 'Моя первая карта' : 'Новая карта',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ownerId: userId // Привязка к пользователю
    }
    
    if (oldData) {
      localStorage.setItem(getMapKey(userId, newMap.id), oldData)
      // Удаляем старые данные после миграции
      localStorage.removeItem(`mindmap_data_${userId}`)
    } else {
      const initialData = {
        version: '2.0',
        timestamp: new Date().toISOString(),
        tree: [{ ...createRootNode(), children: [] }],
        connections: [],
        metadata: { nodeCount: 1, connectionCount: 0 }
      }
      localStorage.setItem(getMapKey(userId, newMap.id), JSON.stringify(initialData))
    }
    
    setMaps([newMap])
    setCurrentMapId(newMap.id)
    saveCatalog([newMap], newMap.id)
    setIsLoaded(true)
  }, [userId, saveCatalog])

  // Создание карты с именем (для Ctrl+S)
  const createMapWithName = useCallback((name) => {
    if (!userId || !name.trim()) return null
    
    const newMap = {
      id: generateId(),
      name: name.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ownerId: userId
    }
    
    const initialData = {
      version: '2.0',
      timestamp: new Date().toISOString(),
      tree: [{ ...createRootNode(), children: [] }],
      connections: [],
      metadata: { nodeCount: 1, connectionCount: 0 }
    }
    
    localStorage.setItem(getMapKey(userId, newMap.id), JSON.stringify(initialData))
    
    const updatedMaps = [...maps, newMap]
    setMaps(updatedMaps)
    setCurrentMapId(newMap.id)
    saveCatalog(updatedMaps, newMap.id)
    setPendingSave(false)
    
    return newMap.id
  }, [maps, userId, saveCatalog])

const createMapWithData = useCallback((name, nodes, connections) => {
  if (!userId || !name.trim()) return null
  
  const newMap = {
    id: generateId(),
    name: name.trim(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ownerId: userId
  }
  
  // Сразу сохраняем переданные данные, а не пустую карту
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
  
  localStorage.setItem(getMapKey(userId, newMap.id), JSON.stringify(data))
  
  const updatedMaps = [...maps, newMap]
  setMaps(updatedMaps)
  setCurrentMapId(newMap.id)
  saveCatalog(updatedMaps, newMap.id)
  
  return newMap.id
}, [maps, userId, saveCatalog])  

  // Обычное создание (для UI)
  const createMap = useCallback((name = 'Новая карта') => {
    return createMapWithName(name)
  }, [createMapWithName])

  const deleteMap = useCallback((mapId) => {
    if (maps.length <= 1) {
      alert('Нельзя удалить последнюю карту')
      return false
    }
    
    localStorage.removeItem(getMapKey(userId, mapId))
    const updatedMaps = maps.filter(m => m.id !== mapId)
    setMaps(updatedMaps)
    
    const newCurrentId = currentMapId === mapId ? updatedMaps[0].id : currentMapId
    setCurrentMapId(newCurrentId)
    saveCatalog(updatedMaps, newCurrentId)
    
    return true
  }, [maps, currentMapId, userId, saveCatalog])

  const renameMap = useCallback((mapId, newName) => {
    const updatedMaps = maps.map(m => 
      m.id === mapId ? { ...m, name: newName, updatedAt: new Date().toISOString() } : m
    )
    setMaps(updatedMaps)
    saveCatalog(updatedMaps, currentMapId)
  }, [maps, currentMapId, saveCatalog])

  const loadMapData = useCallback((mapId) => {
    const data = localStorage.getItem(getMapKey(userId, mapId))
    if (!data) return null
    
    try {
      const parsed = JSON.parse(data)
      if (!parsed.version && Array.isArray(parsed)) {
        return { nodes: parsed, connections: [] }
      }
      return {
        nodes: parsed.tree ? treeToFlat(parsed.tree) : [],
        connections: parsed.connections || [],
        metadata: parsed.metadata
      }
    } catch (e) {
      console.error('Failed to load map:', e)
      return null
    }
  }, [userId])

  const saveMapData = useCallback((mapId, nodes, connections) => {
    const map = maps.find(m => m.id === mapId)
    if (!map || !userId) return

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
    
    localStorage.setItem(getMapKey(userId, mapId), JSON.stringify(data))
    
    // Обновляем время изменения в каталоге
    const updatedMaps = maps.map(m => 
      m.id === mapId ? { ...m, updatedAt: new Date().toISOString() } : m
    )
    setMaps(updatedMaps)
    saveCatalog(updatedMaps, currentMapId)
  }, [maps, userId, currentMapId, saveCatalog])

  const switchMap = useCallback((mapId) => {
    setCurrentMapId(mapId)
  }, [maps, saveCatalog])

  // Для Ctrl+S - запросить имя если нет текущей карты или создать новую
  const requestSaveNewMap = useCallback(() => {
    setPendingSave(true)
  }, [])

  const cancelPendingSave = useCallback(() => {
    setPendingSave(false)
  }, [])

  return {
    maps,
    currentMapId,
    isLoaded,
    pendingSave, 
    createMap,
    createMapWithName,
    createMapWithData,
    deleteMap,
    renameMap,
    loadMapData,
    saveMapData,
    switchMap,
    requestSaveNewMap,
    cancelPendingSave
  }
}