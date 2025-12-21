import { useContext } from 'react'
import { UndoRedoContext } from '../contexts/undoRedoContext'

export function useUndoRedo() {
  const context = useContext(UndoRedoContext)
  if (!context) {
    throw new Error('useUndoRedo must be used within UndoRedoProvider')
  }
  return context
}
