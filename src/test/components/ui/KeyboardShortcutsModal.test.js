import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import KeyboardShortcutsModal from '../../../components/ui/KeyboardShortcutsModal.vue'

// Mock ResponsiveModal
const ResponsiveModalMock = {
  name: 'ResponsiveModal',
  template: '<div><slot /></div>',
  props: ['visible', 'title', 'size'],
  emits: ['close']
}

describe('KeyboardShortcutsModal', () => {
  it('renders correctly when visible', () => {
    const wrapper = mount(KeyboardShortcutsModal, {
      props: {
        visible: true
      },
      global: {
        components: {
          ResponsiveModal: ResponsiveModalMock
        }
      }
    })

    expect(wrapper.exists()).toBe(true)
    expect(wrapper.text()).toContain('Navegación')
    expect(wrapper.text()).toContain('Acciones')
    expect(wrapper.text()).toContain('Ayuda')
  })

  it('displays navigation shortcuts', () => {
    const wrapper = mount(KeyboardShortcutsModal, {
      props: {
        visible: true
      },
      global: {
        components: {
          ResponsiveModal: ResponsiveModalMock
        }
      }
    })

    expect(wrapper.text()).toContain('Ctrl+1')
    expect(wrapper.text()).toContain('Ir a Dashboard')
    expect(wrapper.text()).toContain('Ctrl+2')
    expect(wrapper.text()).toContain('Ir a Proyectos')
  })

  it('displays action shortcuts', () => {
    const wrapper = mount(KeyboardShortcutsModal, {
      props: {
        visible: true
      },
      global: {
        components: {
          ResponsiveModal: ResponsiveModalMock
        }
      }
    })

    expect(wrapper.text()).toContain('Ctrl+Shift+A')
    expect(wrapper.text()).toContain('Abrir Chatbot IA')
    expect(wrapper.text()).toContain('Ctrl+Shift+N')
    expect(wrapper.text()).toContain('Crear Nuevo Proyecto')
  })

  it('emits close event when close button is clicked', async () => {
    const wrapper = mount(KeyboardShortcutsModal, {
      props: {
        visible: true
      },
      global: {
        components: {
          ResponsiveModal: ResponsiveModalMock
        }
      }
    })

    const closeButton = wrapper.find('button')
    await closeButton.trigger('click')

    expect(wrapper.emitted('close')).toBeTruthy()
  })
})