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

export const exportMindMapToPNG = async (element, filename) => {
  if (!element) {
    console.error('Element not found')
    return
  }

  const html2canvas = (await import('html2canvas')).default
  
  const canvas = await html2canvas(element, {
    backgroundColor: '#0f172a',
    scale: 2,
    useCORS: true,
    allowTaint: true,
    logging: false
  })
  
  const link = document.createElement('a')
  link.download = filename || `mindmap_${new Date().toISOString().split('T')[0]}.png`
  link.href = canvas.toDataURL('image/png')
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}