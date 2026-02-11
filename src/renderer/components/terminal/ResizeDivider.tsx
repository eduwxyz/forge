import { useCallback, useRef, useState } from 'react'

interface ResizeDividerProps {
  direction: 'horizontal' | 'vertical'
  onResize: (ratio: number) => void
  onResetRatio: () => void
  containerRef: React.RefObject<HTMLDivElement | null>
}

export default function ResizeDivider({
  direction,
  onResize,
  onResetRatio,
  containerRef
}: ResizeDividerProps) {
  const [dragging, setDragging] = useState(false)
  const isDragging = useRef(false)

  const isHorizontal = direction === 'horizontal'

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      isDragging.current = true
      setDragging(true)

      document.body.style.cursor = isHorizontal ? 'col-resize' : 'row-resize'
      document.body.style.userSelect = 'none'

      const handleMouseMove = (ev: MouseEvent) => {
        if (!isDragging.current || !containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        const ratio = isHorizontal
          ? (ev.clientX - rect.left) / rect.width
          : (ev.clientY - rect.top) / rect.height
        onResize(ratio)
      }

      const handleMouseUp = () => {
        isDragging.current = false
        setDragging(false)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    },
    [direction, onResize, containerRef]
  )

  return (
    <div
      onMouseDown={handleMouseDown}
      onDoubleClick={onResetRatio}
      style={{
        flexShrink: 0,
        [isHorizontal ? 'width' : 'height']: 4,
        [isHorizontal ? 'height' : 'width']: '100%',
        cursor: isHorizontal ? 'col-resize' : 'row-resize',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        zIndex: 10
      }}
    >
      <div
        style={{
          [isHorizontal ? 'width' : 'height']: 2,
          [isHorizontal ? 'height' : 'width']: '100%',
          borderRadius: 1,
          background: dragging ? 'rgba(99, 102, 241, 0.5)' : 'rgba(255, 255, 255, 0.08)',
          transition: 'background 0.15s'
        }}
      />
    </div>
  )
}
