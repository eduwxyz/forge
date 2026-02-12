import { useRef, useCallback } from 'react'
import type { PanelNode } from '../../types'
import { useTerminalStore } from '../../stores/useTerminalStore'
import XTerminal from './XTerminal'
import ResizeDivider from './ResizeDivider'

interface PanelTreeProps {
  node: PanelNode
  focusedPanelId: string
}

export default function PanelTree({ node, focusedPanelId }: PanelTreeProps) {
  if (node.type === 'terminal') {
    return <XTerminal key={node.id} id={node.id} isFocused={node.id === focusedPanelId} />
  }

  return <SplitPanelView node={node} focusedPanelId={focusedPanelId} />
}

function SplitPanelView({
  node,
  focusedPanelId
}: {
  node: Extract<PanelNode, { type: 'split' }>
  focusedPanelId: string
}) {
  const setSplitRatio = useTerminalStore((s) => s.setSplitRatio)
  const containerRef = useRef<HTMLDivElement>(null)

  const isHorizontal = node.direction === 'horizontal'
  const firstPercent = `${node.ratio * 100}%`
  const secondPercent = `${(1 - node.ratio) * 100}%`

  const handleResize = useCallback(
    (ratio: number) => setSplitRatio(node.id, ratio),
    [node.id, setSplitRatio]
  )

  const handleResetRatio = useCallback(
    () => setSplitRatio(node.id, 0.5),
    [node.id, setSplitRatio]
  )

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: isHorizontal ? 'row' : 'column',
        width: '100%',
        height: '100%',
        minWidth: 0,
        minHeight: 0,
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          [isHorizontal ? 'width' : 'height']: firstPercent,
          display: 'flex',
          minWidth: 0,
          minHeight: 0,
          overflow: 'hidden'
        }}
      >
        <PanelTree node={node.first} focusedPanelId={focusedPanelId} />
      </div>

      <ResizeDivider
        direction={node.direction}
        onResize={handleResize}
        onResetRatio={handleResetRatio}
        containerRef={containerRef}
      />

      <div
        style={{
          [isHorizontal ? 'width' : 'height']: secondPercent,
          display: 'flex',
          minWidth: 0,
          minHeight: 0,
          overflow: 'hidden'
        }}
      >
        <PanelTree node={node.second} focusedPanelId={focusedPanelId} />
      </div>
    </div>
  )
}
