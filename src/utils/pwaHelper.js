export function registerPWA() {
  if (typeof window === 'undefined') return
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    const swUrl = `${import.meta.env.BASE_URL}service-worker.js`
    const scope = import.meta.env.BASE_URL
    navigator.serviceWorker.register(swUrl, { scope }).catch(() => {})
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    window.dispatchEvent(new CustomEvent('pwa:install-available'))
  })
}
