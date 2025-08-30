import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import HelpModal from '../../../components/ui/HelpModal.vue'
import ResponsiveModal from '../../../components/ui/ResponsiveModal.vue'

// Mock ResponsiveModal
const ResponsiveModalMock = {
  name: 'ResponsiveModal',
  template: '<div><slot /></div>',
  props: ['visible', 'title', 'size'],
  emits: ['close']
}

describe('HelpModal', () => {
  it('renders correctly when visible', () => {
    const wrapper = mount(HelpModal, {
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
    expect(wrapper.text()).toContain('Guía de Inicio Rápido')
    expect(wrapper.text()).toContain('Características Principales')
    expect(wrapper.text()).toContain('Atajos de Teclado')
  })

  it('shows keyboard shortcuts section', () => {
    const wrapper = mount(HelpModal, {
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
    expect(wrapper.text()).toContain('Ctrl+Shift+A')
    expect(wrapper.text()).toContain('Chatbot IA')
  })

  it('shows features overview', () => {
    const wrapper = mount(HelpModal, {
      props: {
        visible: true
      },
      global: {
        components: {
          ResponsiveModal: ResponsiveModalMock
        }
      }
    })

    expect(wrapper.text()).toContain('Generación con IA')
    expect(wrapper.text()).toContain('Fechas Inteligentes')
    expect(wrapper.text()).toContain('Importar/Exportar')
    expect(wrapper.text()).toContain('Ajuste de Fechas')
  })

  it('emits close event when close button is clicked', async () => {
    const wrapper = mount(HelpModal, {
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