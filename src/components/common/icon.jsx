import React from 'react'
import * as Icons from 'lucide-react'

export const Icon = ({ name, size = 20, className = "", strokeWidth = 2 }) => {
  const LucideIcon = Icons[name]
  
  if (!LucideIcon) {
    console.warn(`Icon ${name} not found`)
    return null
  }
  
  return <LucideIcon size={size} className={className} strokeWidth={strokeWidth} />
}

export default Icon