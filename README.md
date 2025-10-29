# ProjectEZ

Una aplicación web moderna para la gestión de proyectos con generación automática de proyectos usando inteligencia artificial.

## 🚀 Características Principales

- **Gestión de Proyectos**: Crea, edita y organiza proyectos con tareas jerárquicas
- **Generación con IA**: Genera proyectos completos usando OpenAI GPT o Google Gemini
- **Múltiples Proveedores de IA**: Soporte para OpenAI y Google Gemini con fallback automático
- **Calendario Interactivo**: Visualiza tareas y fechas en un calendario intuitivo
- **Diagrama de Gantt**: Planifica y visualiza cronogramas de proyectos
- **Gestión de Equipos**: Asigna tareas a miembros del equipo
- **Importación/Exportación**: Comparte proyectos en múltiples formatos

## 🤖 Integración de IA

### Proveedores Soportados

- **OpenAI GPT-3.5 Turbo**: Generación rápida y eficiente de proyectos
- **Google Gemini Pro**: Alternativa potente con capacidades avanzadas

### Características de IA

- **Fallback Automático**: Si un proveedor falla, automáticamente usa otro
- **Configuración Flexible**: Configura uno o múltiples proveedores
- **Manejo Inteligente de Errores**: Reintentos automáticos y mensajes informativos
- **Generación Contextual**: Crea proyectos basados en descripciones naturales

## 📦 Instalación

1. **Clona el repositorio**
   ```bash
   git clone https://github.com/tu-usuario/projectez.git
   cd projectez
   ```

2. **Instala las dependencias**
   ```bash
   npm install
   ```

3. **Configura las variables de entorno**
   ```bash
   cp .env.example .env
   ```
   
   Edita el archivo `.env` y agrega tus claves API:
   ```env
   # AI API Keys
   VITE_OPENAI_API_KEY="sk-tu-clave-openai"
   VITE_GEMINI_API_KEY="AIza-tu-clave-gemini"
   
   # Default AI Provider (openai or gemini)
   VITE_DEFAULT_AI_PROVIDER="openai"
   ```

4. **Inicia el servidor de desarrollo**
   ```bash
   npm run dev
   ```

## 🔑 Configuración de APIs

### OpenAI
1. Ve a [OpenAI Platform](https://platform.openai.com/)
2. Crea una cuenta y obtén tu clave API
3. Agrega la clave en el archivo `.env` como `VITE_OPENAI_API_KEY`

### Google Gemini
1. Ve a [Google AI Studio](https://makersuite.google.com/)
2. Crea una cuenta y obtén tu clave API
3. Agrega la clave en el archivo `.env` como `VITE_GEMINI_API_KEY`

## 🎯 Uso

### Generación de Proyectos con IA

1. **Accede al Generador**: Haz clic en "Generar con IA" en la interfaz principal
2. **Configura el Proveedor**: Si es la primera vez, configura al menos una API
3. **Describe tu Proyecto**: Escribe una descripción natural del proyecto que deseas crear
4. **Selecciona Complejidad**: Elige entre básico, intermedio o detallado
5. **Genera**: El sistema creará automáticamente tareas, cronogramas y equipos

### Ejemplo de Prompts

- "Crear una aplicación web de e-commerce con carrito de compras y sistema de pagos"
- "Desarrollar una aplicación móvil de fitness con seguimiento de ejercicios"
- "Implementar un sistema de gestión de biblioteca con préstamos y devoluciones"

### Configuración Avanzada

- **Múltiples Proveedores**: Configura tanto OpenAI como Gemini para mayor confiabilidad
- **Cambio de Proveedor**: Cambia entre proveedores según tus necesidades
- **Pruebas de Conexión**: Verifica que tus APIs funcionen correctamente

## 🛠️ Tecnologías

- **Frontend**: Vue.js 3, Vite, TailwindCSS
- **UI Components**: PrimeVue
- **Estado**: Vuex
- **IA**: OpenAI API, Google Gemini API
- **Testing**: Vitest
- **Build**: Vite

## 📁 Estructura del Proyecto

```
src/
├── components/          # Componentes Vue
│   ├── ui/             # Componentes de interfaz
│   ├── project/        # Componentes de proyectos
│   └── task/           # Componentes de tareas
├── services/           # Servicios de API
│   ├── aiService.js    # Servicio unificado de IA
│   ├── openAIService.js # Servicio de OpenAI
│   └── geminiService.js # Servicio de Gemini
├── store/              # Estado global (Vuex)
├── views/              # Páginas principales
└── utils/              # Utilidades
```

## 🧪 Testing

```bash
# Ejecutar todas las pruebas
npm run test

# Ejecutar pruebas con interfaz
npm run test:ui

# Ejecutar pruebas de cobertura
npm run test:coverage
```

## 🚀 Deployment

```bash
# Construir para producción
npm run build

# Vista previa de la build
npm run preview
```

## 📚 Documentación Adicional

- [Integración de Gemini](./INTEGRACION_GEMINI.md) - Guía detallada de la integración de IA
- [Ejemplos de Uso](./src/examples/ai-integration-example.js) - Ejemplos de código para la API de IA

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🆘 Soporte

Si tienes problemas o preguntas:

1. Revisa la [documentación de integración](./INTEGRACION_GEMINI.md)
2. Busca en los [issues existentes](https://github.com/tu-usuario/projectez/issues)
3. Crea un nuevo issue si no encuentras solución

## 🎉 Agradecimientos

- [OpenAI](https://openai.com/) por su API de GPT
- [Google](https://ai.google.dev/) por Gemini API
- [Vue.js](https://vuejs.org/) por el framework
- [PrimeVue](https://primevue.org/) por los componentes UI

