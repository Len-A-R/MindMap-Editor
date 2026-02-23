import { useState, useCallback, useRef } from 'react'

const MAX_HISTORY = 50

export const useHistory = (initialState) => {
  const [history, setHistory] = useState([initialState])
  const [currentIndex, setCurrentIndex] = useState(0)
  const isUndoingRef = useRef(false)

  const canUndo = currentIndex > 0
  const canRedo = currentIndex < history.length - 1

  const pushState = useCallback((newState) => {
    if (isUndoingRef.current) return
    
    setHistory(prev => {
      const newHistory = prev.slice(0, currentIndex + 1)
      newHistory.push(newState)
      
      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift()
        setCurrentIndex(currentIndex)
        return newHistory
      }
      
      return newHistory
    })
    setCurrentIndex(prev => Math.min(prev + 1, MAX_HISTORY - 1))
  }, [currentIndex])

  const undo = useCallback(() => {
    if (!canUndo) return
    isUndoingRef.current = true
    setCurrentIndex(prev => prev - 1)
    setTimeout(() => { isUndoingRef.current = false }, 0)
    return history[currentIndex - 1]
  }, [canUndo, currentIndex, history])

  const redo = useCallback(() => {
    if (!canRedo) return
    isUndoingRef.current = true
    setCurrentIndex(prev => prev + 1)
    setTimeout(() => { isUndoingRef.current = false }, 0)
    return history[currentIndex + 1]
  }, [canRedo, currentIndex, history])

  const reset = useCallback(() => {
    setHistory([initialState])
    setCurrentIndex(0)
  }, [initialState])

  return {
    state: history[currentIndex],
    pushState,
    undo,
    redo,
    canUndo,
    canRedo,
    reset,
    currentIndex
  }
}