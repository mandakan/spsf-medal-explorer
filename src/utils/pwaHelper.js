let deferredInstallPrompt = null

export function registerPWA() {
  if (typeof window === 'undefined') return
  if ('serviceWorker' in navigator) {
    try {
      const swUrl = new URL('../service-worker.js', import.meta.url)
      navigator.serviceWorker.register(swUrl, { type: 'module' }).catch(() => {})
    } catch {
      // Fallback path for environments that don't support new URL with import.meta.url
      navigator.serviceWorker.register('/service-worker.js').catch(() => {})
    }
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredInstallPrompt = e
    window.dispatchEvent(new CustomEvent('pwa:install-available'))
  })
}

export async function promptInstall() {
  if (!deferredInstallPrompt) return { outcome: 'dismissed' }
  deferredInstallPrompt.prompt()
  const choice = await deferredInstallPrompt.userChoice
  deferredInstallPrompt = null
  return choice
}

export function onInstallAvailable(handler) {
  const fn = () => handler()
  window.addEventListener('pwa:install-available', fn)
  return () => window.removeEventListener('pwa:install-available', fn)
}
