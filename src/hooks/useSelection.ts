import { useCallback } from 'react'
import { useDesignStore } from '../store/designStore'

export function useSelection() {
  const select = useDesignStore(s => s.select)
  const deselect = useDesignStore(s => s.deselect)

  const handleCanvasMiss = useCallback(() => {
    deselect()
  }, [deselect])

  return { select, deselect, handleCanvasMiss }
}
