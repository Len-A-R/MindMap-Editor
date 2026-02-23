import React from 'react'
import styles from './Connections.module.css'

const Connections = ({ 
  nodes, 
  connections, 
  selectedConnection,
  onSelectConnection,
  isConnecting, 
  connectStart 
}) => {
  const getNodeCenter = (node) => ({
    x: node?.x || 0,
    y: node?.y || 0
  })

  const getBezierPath = (x1, y1, x2, y2) => {
    const dx = x2 - x1
    const dy = y2 - y1
    const dr = Math.sqrt(dx * dx + dy * dy) * 0.3
    
    return `M ${x1} ${y1} Q ${x1 + dr} ${y1} ${(x1 + x2) / 2} ${(y1 + y2) / 2} T ${x2} ${y2}`
  }

  const getPointOnBezier = (x1, y1, x2, y2, t = 0.5) => {
    const dx = x2 - x1
    const dy = y2 - y1
    const dr = Math.sqrt(dx * dx + dy * dy) * 0.3
    
    const p0 = { x: x1, y: y1 }
    const p1 = { x: x1 + dr, y: y1 }
    const p2 = { x: (x1 + x2) / 2, y: (y1 + y2) / 2 }
    const p3 = { x: x2, y: y2 }
    
    const mt = 1 - t
    return {
      x: mt * mt * mt * p0.x + 3 * mt * mt * t * p1.x + 3 * mt * t * t * p2.x + t * t * t * p3.x,
      y: mt * mt * mt * p0.y + 3 * mt * mt * t * p1.y + 3 * mt * t * t * p2.y + t * t * t * p3.y
    }
  }

  return (
    <svg className={styles.svg}>
      {/* Parent-child связи */}
      {nodes.map(node => {
        if (!node.parentId) return null
        const parent = nodes.find(n => n.id === node.parentId)
        if (!parent || node.isDetached) return null
        
        const start = getNodeCenter(parent)
        const end = getNodeCenter(node)
        
        return (
          <path
            key={`parent-${node.id}`}
            d={getBezierPath(start.x, start.y, end.x, end.y)}
            className={styles.parentConnection}
            fill="none"
          />
        )
      })}

      {/* Пользовательские связи */}
      {connections.map(conn => {
        const from = nodes.find(n => n.id === conn.from)
        const to = nodes.find(n => n.id === conn.to)
        if (!from || !to) return null
        
        const start = getNodeCenter(from)
        const end = getNodeCenter(to)
        const isSelected = selectedConnection === conn.id
        
        const midPoint = getPointOnBezier(start.x, start.y, end.x, end.y, 0.5)
        
        return (
          <g 
            key={`conn-${conn.id}`}
            className={`${styles.connectionGroup} ${isSelected ? styles.selected : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              onSelectConnection(conn.id)
            }}
          >
            {/* Невидимая область для клика */}
            <path
              d={getBezierPath(start.x, start.y, end.x, end.y)}
              className={styles.hitArea}
              fill="none"
            />
            
            {/* Видимая линия */}
            <path
              d={getBezierPath(start.x, start.y, end.x, end.y)}
              className={styles.customConnection}
              fill="none"
              strokeDasharray={conn.style?.dashed !== false ? "5,5" : "none"}
            />
            
            {/* Маркеры */}
            <circle cx={start.x} cy={start.y} r="4" className={styles.connectionPoint} />
            <circle cx={end.x} cy={end.y} r="4" className={styles.connectionPoint} />
            
            {/* Текст связи */}
            {conn.text && (
              <g className={styles.connectionLabel} transform={`translate(${midPoint.x}, ${midPoint.y})`}>
                <rect
                  x="-40"
                  y="-10"
                  width="80"
                  height="20"
                  rx="4"
                  className={styles.labelBg}
                />
                <text
                  y="4"
                  textAnchor="middle"
                  className={styles.labelText}
                >
                  {conn.text}
                </text>
              </g>
            )}
            
            {/* Индикатор выделения */}
            {isSelected && (
              <circle
                cx={midPoint.x}
                cy={midPoint.y}
                r="6"
                className={styles.selectionIndicator}
              />
            )}
          </g>
        )
      })}
    </svg>
  )
}

export default Connections