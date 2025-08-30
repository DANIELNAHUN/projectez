import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useKeyboardShortcuts } from '../../composables/useKeyboardShortcuts.js'

// Mock vue-router
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn()
  })
}))

// Mock Vue composition API
vi.mock('vue', () => ({
  onMounted: vi.fn((callback) => callback()),
  onUnmounted: vi.fn()
}))

describe('useKeyboardShortcuts', () => {
  let addEventListenerSpy
  let removeEventListenerSpy
  let dispatchEventSpy

  beforeEach(() => {
    addEventListenerSpy = vi.spyOn(document, 'addEventListener')
    removeEventListenerSpy = vi.spyOn(document, 'removeEventListener')
    dispatchEventSpy = vi.spyOn(window, 'dispatchEvent')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('registers keyboard event listener on mount', () => {
    useKeyboardShortcuts()
    
    expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
  })

  it('provides shortcut registration functionality', () => {
    const { registerShortcut, unregisterShortcut } = useKeyboardShortcuts()
    
    expect(typeof registerShortcut).toBe('function')
    expect(typeof unregisterShortcut).toBe('function')
  })

  it('returns list of available shortcuts', () => {
    const { shortcuts } = useKeyboardShortcuts()
    
    expect(Array.isArray(shortcuts)).toBe(true)
    expect(shortcuts.length).toBeGreaterThan(0)
    expect(shortcuts).toContain('ctrl+1')
    expect(shortcuts).toContain('ctrl+shift+a')
  })

  it('can register and unregister custom shortcuts', () => {
    const { registerShortcut, unregisterShortcut, shortcuts } = useKeyboardShortcuts()
    
    const initialCount = shortcuts.length
    const testCallback = vi.fn()
    
    registerShortcut('ctrl+t', testCallback)
    expect(shortcuts.length).toBe(initialCount + 1)
    expect(shortcuts).toContain('ctrl+t')
    
    unregisterShortcut('ctrl+t')
    expect(shortcuts.length).toBe(initialCount)
    expect(shortcuts).not.toContain('ctrl+t')
  })
})