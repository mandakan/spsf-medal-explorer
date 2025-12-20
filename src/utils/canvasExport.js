export function exportCanvasToPNG(canvas, filename = 'skill-tree.png') {
  try {
    const link = document.createElement('a')
    link.href = canvas.toDataURL('image/png')
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (e) {
    // Fallback: open in new tab
    window.open(canvas.toDataURL('image/png'), '_blank')
  }
}
