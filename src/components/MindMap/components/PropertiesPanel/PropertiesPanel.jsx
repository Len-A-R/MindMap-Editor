import React from 'react'
import { Icon } from '@components/common/Icon.jsx'
import styles from './PropertiesPanel.module.css'

const borderWidthLabels = {
  '0': 'Нет',
  '1': 'Супертонкий',
  '2': 'Разреженный',
  '3': 'Средний',
  '5': 'Жирный',
  '8': 'Супержирный'
}

const PropertiesPanel = ({ 
  selectedNodes, 
  selectedConnection,
  nodes, 
  connections,
  onUpdateNodes, 
  onUpdateConnection,
  onDeleteConnection,
  onClose 
}) => {
  // Панель для связи
  if (selectedConnection && (!selectedNodes || selectedNodes.length === 0)) {
    const conn = connections.find(c => c.id === selectedConnection)
    if (!conn) return null
    
    const fromNode = nodes.find(n => n.id === conn.from)
    const toNode = nodes.find(n => n.id === conn.to)
    
    return (
      <div className={styles.panel}>
        <div className={styles.header}>
          <h3><Icon name="Link" size={14} /> Связь</h3>
          <button onClick={onClose} className={styles.closeBtn}>
            <Icon name="X" size={14} />
          </button>
        </div>
        
        <div className={styles.content}>
          <div className={styles.row}>
            <span className={styles.label}>От:</span>
            <span className={styles.nodeName}>{fromNode?.text || 'Unknown'}</span>
          </div>
          
          <div className={styles.row}>
            <span className={styles.label}>К:</span>
            <span className={styles.nodeName}>{toNode?.text || 'Unknown'}</span>
          </div>
          
          <div className={styles.divider} />
          
          <div className={styles.row}>
            <span className={styles.iconLabel}><Icon name="Type" size={12} /></span>
            <input
              type="text"
              value={conn.text || ''}
              onChange={(e) => onUpdateConnection(conn.id, { text: e.target.value })}
              className={styles.textInput}
              placeholder="Подпись связи"
            />
          </div>
          
          <div className={styles.row}>
            <span className={styles.iconLabel}><Icon name="Minus" size={12} /></span>
            <select
              value={conn.style?.dashed !== false ? 'dashed' : 'solid'}
              onChange={(e) => onUpdateConnection(conn.id, { 
                style: { ...conn.style, dashed: e.target.value === 'dashed' }
              })}
              className={styles.select}
            >
              <option value="dashed">Пунктир</option>
              <option value="solid">Сплошная</option>
            </select>
          </div>
          
          <div className={styles.row}>
            <span className={styles.iconLabel}><Icon name="Palette" size={12} /></span>
            <input
              type="color"
              value={conn.style?.color || '#f59e0b'}
              onChange={(e) => onUpdateConnection(conn.id, { 
                style: { ...conn.style, color: e.target.value }
              })}
              className={styles.colorBtn}
            />
          </div>
          
          <div className={styles.divider} />
          
          <button
            onClick={() => onDeleteConnection(conn.id)}
            className={styles.deleteBtn}
          >
            <Icon name="Trash2" size={14} />
            Удалить связь
          </button>
        </div>
      </div>
    )
  }

  // Множественное выделение узлов
  if (selectedNodes.length > 1) {
    return (
      <div className={styles.panel}>
        <div className={styles.header}>
          <h3>{selectedNodes.length} узлов</h3>
          <button onClick={onClose} className={styles.closeBtn}>
            <Icon name="X" size={14} />
          </button>
        </div>
        <p className={styles.multiSelect}>Выберите один узел для редактирования свойств</p>
      </div>
    )
  }

  // Один узел
  if (selectedNodes.length !== 1) return null

  const selectedNode = nodes.find(n => n.id === selectedNodes[0])
  if (!selectedNode) return null

  const updateStyle = (updates) => {
    onUpdateNodes(selectedNodes, updates)
  }

  const currentWidth = String(selectedNode.style?.borderWidth ?? 2)

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h3><Icon name="Settings" size={14} /> Свойства</h3>
        <button onClick={onClose} className={styles.closeBtn}>
          <Icon name="X" size={14} />
        </button>
      </div>

      <div className={styles.content}>
        {/* Текст */}
        <div className={styles.row}>
          <input
            type="text"
            value={selectedNode.text}
            onChange={(e) => updateStyle({ text: e.target.value })}
            className={styles.textInput}
            placeholder="Текст узла"
          />
        </div>

        {/* Шрифт и размер */}
        <div className={styles.row}>
          <input
            type="number"
            value={selectedNode.style?.fontSize || 14}
            onChange={(e) => updateStyle({ fontSize: parseInt(e.target.value) })}
            className={styles.smallInput}
            min="8"
            max="72"
          />
          <select
            value={selectedNode.style?.fontFamily || 'Inter'}
            onChange={(e) => updateStyle({ fontFamily: e.target.value })}
            className={styles.select}
          >
            <option value="Inter">Inter</option>
            <option value="Arial">Arial</option>
            <option value="Georgia">Georgia</option>
            <option value="Courier">Courier</option>
          </select>
        </div>

        {/* Форматирование */}
        <div className={styles.formatRow}>
          <button
            onClick={() => updateStyle({ fontWeight: selectedNode.style?.fontWeight === 'bold' ? 'normal' : 'bold' })}
            className={`${styles.formatBtn} ${selectedNode.style?.fontWeight === 'bold' ? styles.active : ''}`}
          >
            <strong>B</strong>
          </button>
          <button
            onClick={() => updateStyle({ fontStyle: selectedNode.style?.fontStyle === 'italic' ? 'normal' : 'italic' })}
            className={`${styles.formatBtn} ${selectedNode.style?.fontStyle === 'italic' ? styles.active : ''}`}
          >
            <em>I</em>
          </button>
          <button
            onClick={() => updateStyle({ textDecoration: selectedNode.style?.textDecoration === 'underline' ? 'none' : 'underline' })}
            className={`${styles.formatBtn} ${selectedNode.style?.textDecoration === 'underline' ? styles.active : ''}`}
          >
            <u>U</u>
          </button>
          <input
            type="color"
            value={selectedNode.style?.color || '#ffffff'}
            onChange={(e) => updateStyle({ color: e.target.value })}
            className={styles.colorBtn}
          />
        </div>

        {/* Форма */}
        <div className={styles.row}>
          <span className={styles.iconLabel}><Icon name="Shapes" size={12} /></span>
          <div className={styles.shapes}>
            {['rectangle', 'circle', 'diamond'].map(shape => (
              <button
                key={shape}
                onClick={() => updateStyle({ shape })}
                className={`${styles.shapeBtn} ${selectedNode.style?.shape === shape ? styles.active : ''}`}
              >
                <div className={`${styles.shapeIcon} ${styles[shape]}`} />
              </button>
            ))}
          </div>
        </div>

        {/* Цвета */}
        <div className={styles.row}>
          <div className={styles.colorGroup}>
            <span className={styles.iconLabel}><Icon name="PaintBucket" size={12} /></span>
            <input
              type="color"
              value={selectedNode.style?.backgroundColor || '#1e293b'}
              onChange={(e) => updateStyle({ backgroundColor: e.target.value })}
              className={styles.colorBtn}
            />
          </div>
          <div className={styles.colorGroup}>
            <span className={styles.iconLabel}><Icon name="Square" size={12} /></span>
            <input
              type="color"
              value={selectedNode.style?.borderColor || '#3b82f6'}
              onChange={(e) => updateStyle({ borderColor: e.target.value })}
              className={styles.colorBtn}
            />
          </div>
        </div>

        {/* Толщина границы */}
        <div className={styles.row}>
          <span className={styles.iconLabel} title="Толщина границы">
            <Icon name="Minus" size={12} />
          </span>
          <select
            value={currentWidth}
            onChange={(e) => {
              const width = parseInt(e.target.value)
              updateStyle({ borderWidth: width })
            }}
            className={styles.select}
          >
            {Object.entries(borderWidthLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {/* Скругление */}
        <div className={styles.row}>
          <span className={styles.iconLabel} title="Скругление">
            <span className={styles.cornerIcon}></span>
          </span>
          <input
            type="range"
            min="0"
            max="50"
            value={selectedNode.style?.borderRadius || 8}
            onChange={(e) => updateStyle({ borderRadius: parseInt(e.target.value) })}
            className={styles.range}
          />
          <span className={styles.value}>{selectedNode.style?.borderRadius || 8}</span>
        </div>

        {/* Ширина */}
        <div className={styles.row}>
          <span className={styles.iconLabel} title="Ширина">
            <Icon name="MoveHorizontal" size={12} />
          </span>
          <input
            type="range"
            min="80"
            max="300"
            value={selectedNode.style?.width || 140}
            onChange={(e) => updateStyle({ width: parseInt(e.target.value) })}
            className={styles.range}
          />
          <span className={styles.value}>{selectedNode.style?.width || 140}</span>
        </div>
      </div>
    </div>
  )
}

export default PropertiesPanel