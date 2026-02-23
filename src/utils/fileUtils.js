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

export const exportAsImage = (canvasElement, filename) => {
  // Convert SVG to canvas and download as PNG
  const svgData = new XMLSerializer().serializeToString(canvasElement)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const img = new Image()
  
  img.onload = () => {
    canvas.width = img.width
    canvas.height = img.height
    ctx.drawImage(img, 0, 0)
    const a = document.createElement('a')
    a.download = filename || 'mindmap.png'
    a.href = canvas.toDataURL('image/png')
    a.click()
  }
  
  img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
}