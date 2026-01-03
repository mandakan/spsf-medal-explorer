let deferredInstallPrompt = null

export function registerPWA() {
  if (typeof window === 'undefined') return
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    const swUrl = `${import.meta.env.BASE_URL}service-worker.js`
    const scope = import.meta.env.BASE_URL
    navigator.serviceWorker.register(swUrl, { scope }).catch(() => {})
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredInstallPrompt = e
    window.dispatchEvent(new CustomEvent('pwa:install-available'))
  })
}

async function promptInstall() {
  if (!deferredInstallPrompt) return { outcome: 'dismissed' }
  deferredInstallPrompt.prompt()
  const choice = await deferredInstallPrompt.userChoice
  deferredInstallPrompt = null
  return choice
}

function onInstallAvailable(handler) {
  const fn = () => handler()
  window.addEventListener('pwa:install-available', fn)
  return () => window.removeEventListener('pwa:install-available', fn)
}
