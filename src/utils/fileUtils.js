export const saveToFile = (data, filename) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename || `mindmap_${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export const loadFromFile = (callback) => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result)
        callback(null, data)
      } catch (err) {
        callback(err, null)
      }
    }
    reader.onerror = () => callback(new Error('Failed to read file'), null)
    reader.readAsText(file)
  }
  input.click()
}

// экспорт в PNG
export const exportToPNG = async (svgElement, filename) => {
  if (!svgElement) {
    console.error('SVG element not found')
    return
  }

  // Получаем размеры SVG
  const svgRect = svgElement.getBoundingClientRect()
  const width = Math.max(svgRect.width, 100)
  const height = Math.max(svgRect.height, 100)

  // Создаём canvas
  const canvas = document.createElement('canvas')
  canvas.width = width * 2 // Увеличиваем разрешение
  canvas.height = height * 2
  const ctx = canvas.getContext('2d')
  ctx.scale(2, 2)

  // Заливаем фон
  ctx.fillStyle = '#0f172a'
  ctx.fillRect(0, 0, width, height)

  // Получаем SVG как строку
  const svgData = new XMLSerializer().serializeToString(svgElement)
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(svgBlob)

  // Рисуем SVG на canvas
  const img = new Image()
  img.onload = () => {
    ctx.drawImage(img, 0, 0, width, height)
    URL.revokeObjectURL(url)

    // Скачиваем PNG
    const pngUrl = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = pngUrl
    a.download = filename || `mindmap_${new Date().toISOString().split('T')[0]}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }
  img.src = url
}