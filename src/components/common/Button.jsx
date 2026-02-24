import React from 'react'
import { Icon } from './Icon'

export const Button = ({ 
  children, 
  onClick, 
  variant = 'default', 
  size = 'md',
  icon = null,
  disabled = false,
  className = '',
  title = ''
}) => {
  const variants = {
    default: 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white',
    primary: 'bg-blue-500 hover:bg-blue-600 text-white',
    danger: 'bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300',
    ghost: 'hover:bg-slate-800 text-slate-400 hover:text-white',
    active: 'bg-blue-500 text-white'
  }
  
  const sizes = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'px-4 py-2'
  }
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        ${variants[variant]}
        ${sizes[size]}
        rounded-lg transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center gap-2
        ${className}
      `}
    >
      {icon && <Icon name={icon} size={size === 'sm' ? 16 : 18} />}
      {children}
    </button>
  )
}

export default Button