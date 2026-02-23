import React, { useRef, useEffect, useState } from 'react'
import { Icon } from '@components/common/Icon.jsx'
import styles from './Node.module.css'

const Node = ({ 
  node, 
  isSelected, 
  isEditing, 
  isConnecting,
  onSelect, 
  onUpdate, 
  onStartDrag, 
  onStartEdit, 
  onFinishEdit,
  onAddChild,
  scale 
}) => {
  const nodeRef = useRef(null)
  const contentRef = useRef(null)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    if (isEditing && contentRef.current) {
      contentRef.current.focus()
      const range = document.createRange()
      range.selectNodeContents(contentRef.current)
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)
    }
  }, [isEditing])

  const handleMouseDown = (e) => {
    if (isEditing) return
    e.stopPropagation()
    onSelect(node.id)
    onStartDrag(e, node.id)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'F2') {
      e.preventDefault()
      onStartEdit(node.id)
    }
  }

  const handleBlur = () => {
    if (isEditing && contentRef.current) {
      onFinishEdit(node.id, contentRef.current.innerText)
    }
  }

  // ОБРАБОТКА КЛАВИШ В РЕЖИМЕ РЕДАКТИРОВАНИЯ
  const handleKeyDownContent = (e) => {
    // Enter без Shift - выход из редактирования
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      e.stopPropagation() // Останавливаем всплытие!
      onFinishEdit(node.id, contentRef.current.innerText)
    }
    // Escape - выход из редактирования
    else if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      onFinishEdit(node.id, contentRef.current.innerText)
    }
    // Tab - вставляем табуляцию, не выходим
    else if (e.key === 'Tab') {
      e.preventDefault()
      e.stopPropagation()
      document.execCommand('insertText', false, '\t')
    }
  }

  const getShapeStyles = () => {
    const { shape, borderRadius } = node.style
    const base = {
      borderRadius: shape === 'circle' ? '50%' : `${borderRadius || 8}px`,
      aspectRatio: shape === 'circle' ? '1' : 'auto'
    }
    
    if (shape === 'diamond') {
      return {
        ...base,
        borderRadius: '4px',
        transform: 'rotate(45deg)',
        transformOrigin: 'center'
      }
    }
    
    return base
  }

  const shapeStyles = getShapeStyles()

  return (
    <div
      ref={nodeRef}
      className={`${styles.node} ${isSelected ? styles.selected : ''} ${isConnecting ? styles.connecting : ''}`}
      style={{
        left: node.x,
        top: node.y,
        transform: 'translate(-50%, -50%)',
        cursor: isEditing ? 'text' : 'move',
        zIndex: isSelected ? 50 : isHovered ? 20 : 10
      }}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div
        className={styles.shape}
        style={{
          ...shapeStyles,
          backgroundColor: node.style.backgroundColor || '#1e293b',
          borderWidth: node.style.borderWidth || 0,
          borderStyle: (node.style.borderWidth || 0) > 0 ? 'solid' : 'none',
          borderColor: (node.style.borderWidth || 0) > 0 ? (node.style.borderColor || '#3b82f6') : 'transparent',
          minWidth: `${node.style.width || 140}px`,
          padding: `${node.style.padding || 12}px`,
          boxShadow: isSelected 
            ? '0 0 20px rgba(59, 130, 246, 0.5), 0 4px 6px -1px rgba(0, 0, 0, 0.3)'
            : '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
        }}
      >
        <div
          ref={contentRef}
          className={styles.content}
          contentEditable={isEditing}
          onBlur={handleBlur}
          onKeyDown={handleKeyDownContent} // Обработка клавиш внутри contentEditable
          style={{
            color: node.style.color || '#ffffff',
            fontSize: `${node.style.fontSize || 14}px`,
            fontWeight: node.style.fontWeight || 'normal',
            fontStyle: node.style.fontStyle || 'normal',
            textDecoration: node.style.textDecoration || 'none',
            fontFamily: node.style.fontFamily || 'Inter',
            transform: node.style.shape === 'diamond' ? 'rotate(-45deg)' : 'none',
            minHeight: '20px',
            whiteSpace: 'pre-wrap',
            outline: 'none'
          }}
          suppressContentEditableWarning={true}
        >
          {node.text}
        </div>

        {isSelected && !isEditing && (
          <>
            <button
              className={styles.addBtn}
              onClick={(e) => {
                e.stopPropagation()
                onAddChild(node.id)
              }}
              title="Добавить дочерний узел"
            >
              <Icon name="Plus" size={14} />
            </button>
            
            {node.isDetached && (
              <div className={styles.detachedBadge} title="Откреплен от родителя">
                <Icon name="Unlink" size={10} />
              </div>
            )}
          </>
        )}
      </div>
      
      {isConnecting && (
        <div className={styles.connectingIndicator}>
          <Icon name="Link" size={16} />
        </div>
      )}
    </div>
  )
}

export default Node