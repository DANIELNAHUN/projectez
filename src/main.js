import { createApp } from 'vue'
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import ConfirmationService from 'primevue/confirmationservice'
import ToastService from 'primevue/toastservice'
import Tooltip from 'primevue/tooltip'
import 'primeicons/primeicons.css'
import './style.css'
import App from './App.vue'
import router from './router'
import store from './store'
import { useTheme } from './composables/useTheme'

const app = createApp(App)

app.use(router)
app.use(store)
app.use(PrimeVue, {
  theme: {
    preset: Aura
  }
})
app.use(ConfirmationService)
app.use(ToastService)
app.directive('tooltip', Tooltip)

// Inicializar el tema antes de montar la aplicación
const { initializeTheme } = useTheme()
initializeTheme()

// Inicializar datos de prueba en desarrollo
if (import.meta.env.DEV) {
  import('./utils/sampleData.js').then(({ initializeSampleData }) => {
    initializeSampleData()
  })
}

app.mount('#app')
