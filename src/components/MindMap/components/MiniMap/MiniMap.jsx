import React, { useState } from 'react'
import styles from './MiniMap.module.css'

const MiniMap = ({ nodes, connections, scale, offset, onNavigate }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  
  if (nodes.length === 0) return null

  // Вычисляем реальные границы с учетом размеров узлов
  const getNodeBounds = (node) => {
    const width = node.style?.width || 140
    const padding = node.style?.padding || 12
    const fontSize = node.style?.fontSize || 14
    
    // Вычисляем высоту на основе текста
    const lineCount = (node.text || '').split('\n').length || 1
    const lineHeight = fontSize * 1.2
    const height = Math.max(lineHeight * lineCount + padding * 2, fontSize + padding * 2)
    
    const borderWidth = node.style?.borderWidth || 2
    
    return {
      width,
      height,
      halfWidth: width / 2,
      halfHeight: height / 2,
      borderWidth
    }
  }

  const bounds = nodes.map(getNodeBounds)
  const xs = nodes.map((n, i) => [n.x - bounds[i].halfWidth, n.x + bounds[i].halfWidth]).flat()
  const ys = nodes.map((n, i) => [n.y - bounds[i].halfHeight, n.y + bounds[i].halfHeight]).flat()
  
  const minX = Math.min(...xs) - 50
  const maxX = Math.max(...xs) + 50
  const minY = Math.min(...ys) - 50
  const maxY = Math.max(...ys) + 50
  
  const contentWidth = maxX - minX
  const contentHeight = maxY - minY
  
  const mapWidth = isExpanded ? 200 : 160
  const mapHeight = isExpanded ? 150 : 110
  
  const scaleX = mapWidth / contentWidth
  const scaleY = mapHeight / contentHeight
  const mapScale = Math.min(scaleX, scaleY)

  const viewX = -offset.x / scale
  const viewY = -offset.y / scale
  const viewW = window.innerWidth / scale
  const viewH = window.innerHeight / scale

  const toMapX = (x) => (x - minX) * mapScale
  const toMapY = (y) => (y - minY) * mapScale

  // Пропорциональный размер узла для миникарты
  const getNodeRenderSize = (node, bounds) => {
    const minSize = 3
    const scaledWidth = Math.max(bounds.width * mapScale * 0.25, minSize)
    const scaledHeight = Math.max(bounds.height * mapScale * 0.25, minSize)
    const scaledBorder = Math.max((node.style?.borderWidth || 2) * mapScale * 0.25, 0.5)
    const scaledRadius = Math.min((node.style?.borderRadius || 8) * mapScale * 0.25, scaledHeight / 2)
    
    return {
      width: scaledWidth,
      height: scaledHeight,
      borderWidth: Math.min(scaledBorder, 2),
      borderRadius: scaledRadius
    }
  }

  // Кривая Безье
  const getBezierPath = (x1, y1, x2, y2) => {
    const dx = x2 - x1
    const dy = y2 - y1
    const dr = Math.sqrt(dx * dx + dy * dy) * 0.3
    
    return `M ${x1} ${y1} Q ${x1 + dr} ${y1} ${(x1 + x2) / 2} ${(y1 + y2) / 2} T ${x2} ${y2}`
  }

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top
    
    const worldX = (clickX / mapScale) + minX
    const worldY = (clickY / mapScale) + minY
    
    onNavigate(worldX, worldY)
  }

  return (
    <div 
      className={`${styles.minimap} ${isExpanded ? styles.expanded : ''}`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <svg 
        width={mapWidth} 
        height={mapHeight}
        className={styles.svg}
        onClick={handleClick}
      >
        <rect 
          width={mapWidth} 
          height={mapHeight} 
          className={styles.background}
        />
        
        {/* Связи parent-child */}
        {nodes.map(node => {
          if (!node.parentId) return null
          const parent = nodes.find(n => n.id === node.parentId)
          if (!parent || node.isDetached) return null
          
          const x1 = toMapX(parent.x)
          const y1 = toMapY(parent.y)
          const x2 = toMapX(node.x)
          const y2 = toMapY(node.y)
          
          return (
            <path
              key={`tree-${node.id}`}
              d={getBezierPath(x1, y1, x2, y2)}
              className={styles.treeConnection}
              fill="none"
            />
          )
        })}
        
        {/* Произвольные связи */}
        {connections.map(conn => {
          const from = nodes.find(n => n.id === conn.from)
          const to = nodes.find(n => n.id === conn.to)
          if (!from || !to) return null
          
          const x1 = toMapX(from.x)
          const y1 = toMapY(from.y)
          const x2 = toMapX(to.x)
          const y2 = toMapY(to.y)
          
          return (
            <path
              key={`conn-${conn.id}`}
              d={getBezierPath(x1, y1, x2, y2)}
              className={styles.customConnection}
              fill="none"
            />
          )
        })}
        
        {/* Узлы с цветами и размерами */}
        {nodes.map(node => {
          const nodeBounds = getNodeBounds(node)
          const renderSize = getNodeRenderSize(node, nodeBounds)
          const x = toMapX(node.x)
          const y = toMapY(node.y)
          const isRoot = !node.parentId
          const shape = node.style?.shape || 'rectangle'
          
          const bgColor = node.style?.backgroundColor || (isRoot ? '#3b82f6' : '#1e293b')
          const borderColor = (node.style?.borderWidth || 0) > 0 
            ? (node.style?.borderColor || '#3b82f6') 
            : 'transparent'
          
          const w = renderSize.width
          const h = renderSize.height
          const bx = x - w/2
          const by = y - h/2
          const r = renderSize.borderRadius
          const bw = renderSize.borderWidth
          
          if (shape === 'circle') {
            const radius = Math.max(w, h) / 2
            return (
              <g key={node.id}>
                {/* Граница (если есть) */}
                {bw > 0 && (
                  <circle
                    cx={x}
                    cy={y}
                    r={radius + bw}
                    fill={borderColor}
                  />
                )}
                {/* Фон */}
                <circle
                  cx={x}
                  cy={y}
                  r={radius}
                  fill={bgColor}
                />
              </g>
            )
          }
          
          if (shape === 'diamond') {
            const size = Math.max(w, h)
            const diamondPath = (cx, cy, s, cornerR) => {
              const half = s / 2
              // Для ромба используем path с закругленными углами если нужно
              return `M ${cx} ${cy - half} L ${cx + half} ${cy} L ${cx} ${cy + half} L ${cx - half} ${cy} Z`
            }
            
            return (
              <g key={node.id}>
                {/* Граница */}
                {bw > 0 && (
                  <rect
                    x={bx - bw}
                    y={by - bw}
                    width={w + bw * 2}
                    height={h + bw * 2}
                    transform={`rotate(45 ${x} ${y})`}
                    fill={borderColor}
                    rx={r}
                  />
                )}
                {/* Фон */}
                <rect
                  x={bx}
                  y={by}
                  width={w}
                  height={h}
                  transform={`rotate(45 ${x} ${y})`}
                  fill={bgColor}
                  rx={r}
                />
              </g>
            )
          }
          
          // rectangle
          return (
            <g key={node.id}>
              {/* Граница */}
              {bw > 0 && (
                <rect
                  x={bx - bw}
                  y={by - bw}
                  width={w + bw * 2}
                  height={h + bw * 2}
                  rx={r + bw/2}
                  fill={borderColor}
                />
              )}
              {/* Фон */}
              <rect
                x={bx}
                y={by}
                width={w}
                height={h}
                rx={r}
                fill={bgColor}
              />
            </g>
          )
        })}
        
        {/* Viewport */}
        {(() => {
          // Вычисляем координаты и размеры прямоугольника в координатах миникарты
          let vx = toMapX(viewX);
          let vy = toMapY(viewY);
          let vw = viewW * mapScale;
          let vh = viewH * mapScale;

          // Ограничиваем позицию, чтобы прямоугольник не выходил за левую/верхнюю границу
          let x = Math.max(0, vx);
          let y = Math.max(0, vy);

          // Если после ограничения позиции прямоугольник выходит за правую/нижнюю границу,
          // уменьшаем его размер
          if (x + vw > mapWidth) {
            vw = mapWidth - x;
          }
          if (y + vh > mapHeight) {
            vh = mapHeight - y;
          }

          // Финальные значения (размер не может быть отрицательным)
          const width = Math.max(0, vw);
          const height = Math.max(0, vh);

          return (
            <rect
              x={x}
              y={y}
              width={width}
              height={height}
              className={styles.viewport}
            />
          );
        })()}
      </svg>
    </div>
  )
}

export default MiniMap