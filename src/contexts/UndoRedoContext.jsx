import React, { useState, useCallback, useMemo } from 'react'
import { UndoRedoContext } from './undoRedoContext'


const HISTORY_LIMIT = 200

export function UndoRedoProvider({ children }) {
  const [history, setHistory] = useState([])        // array of snapshots
  const [historyIndex, setHistoryIndex] = useState(-1) // pointer to current snapshot

  const pushState = useCallback((snapshot) => {
    setHistory(prev => {
      const next = prev.slice(0, historyIndex + 1)
      next.push(snapshot)
      // Cap history to limit
      const trimmed = next.length > HISTORY_LIMIT ? next.slice(next.length - HISTORY_LIMIT) : next
      setHistoryIndex(trimmed.length - 1)
      return trimmed
    })
  }, [historyIndex])

  const undo = useCallback(() => {
    let value = null
    setHistoryIndex(idx => {
      const nextIdx = idx > 0 ? idx - 1 : idx
      value = nextIdx !== idx ? nextIdx : null
      return nextIdx
    })
    return value
  }, [])

  const redo = useCallback(() => {
    let value = null
    setHistoryIndex((idx) => {
      const nextIdx = idx < history.length - 1 ? idx + 1 : idx
      value = nextIdx !== idx ? nextIdx : null
      return nextIdx
    })
    return value
  }, [history.length])

  const canUndo = historyIndex > 0
  const canRedo = historyIndex >= 0 && historyIndex < history.length - 1

  const value = useMemo(() => ({
    pushState,
    undo,
    redo,
    canUndo,
    canRedo,
    history,
    historyIndex
  }), [pushState, undo, redo, canUndo, canRedo, history, historyIndex])

  return (
    <UndoRedoContext.Provider value={value}>
      {children}
    </UndoRedoContext.Provider>
  )
}
