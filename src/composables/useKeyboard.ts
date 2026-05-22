import { onMounted, onUnmounted } from 'vue'

type ShortcutMap = Record<string, (e: KeyboardEvent) => void>

export function useKeyboard(shortcuts: ShortcutMap) {
  function handleKeyDown(e: KeyboardEvent) {
    const tag = (e.target as HTMLElement).tagName
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return
    const handler = shortcuts[e.key] ?? shortcuts[e.key.toLowerCase()]
    if (handler) {
      e.preventDefault()
      handler(e)
    }
  }

  onMounted(() => window.addEventListener('keydown', handleKeyDown))
  onUnmounted(() => window.removeEventListener('keydown', handleKeyDown))
}

export function useModalKeyboard(onClose: () => void) {
  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') onClose()
  }
  onMounted(() => window.addEventListener('keydown', handleKeyDown))
  onUnmounted(() => window.removeEventListener('keydown', handleKeyDown))
}
