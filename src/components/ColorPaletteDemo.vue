<template>
  <div class="p-8 space-y-8">
    <!-- Header -->
    <div class="text-center">
      <h1 class="text-3xl font-bold text-earth-dark-olive mb-2">Color Palette -06</h1>
      <p class="text-earth-brown">Paleta de colores tierra implementada en el proyecto</p>
    </div>

    <!-- Paleta de colores principal -->
    <div class="bg-earth-light-gray p-6 rounded-lg border border-earth-golden">
      <h2 class="text-xl font-semibold text-earth-dark-olive mb-4">Colores Principales</h2>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div class="text-center">
          <div class="w-16 h-16 bg-earth-dark-olive rounded-lg mx-auto mb-2"></div>
          <p class="text-sm font-medium text-earth-dark-olive">Verde Oscuro</p>
          <p class="text-xs text-earth-brown">#3E350E</p>
        </div>
        <div class="text-center">
          <div class="w-16 h-16 bg-earth-golden rounded-lg mx-auto mb-2"></div>
          <p class="text-sm font-medium text-earth-dark-olive">Dorado</p>
          <p class="text-xs text-earth-brown">#DAAD29</p>
        </div>
        <div class="text-center">
          <div class="w-16 h-16 bg-earth-light-gray rounded-lg mx-auto mb-2 border border-earth-olive"></div>
          <p class="text-sm font-medium text-earth-dark-olive">Gris Claro</p>
          <p class="text-xs text-earth-brown">#EAE9E7</p>
        </div>
        <div class="text-center">
          <div class="w-16 h-16 bg-earth-brown rounded-lg mx-auto mb-2"></div>
          <p class="text-sm font-medium text-earth-dark-olive">Marrón</p>
          <p class="text-xs text-earth-brown">#794515</p>
        </div>
        <div class="text-center">
          <div class="w-16 h-16 bg-earth-olive rounded-lg mx-auto mb-2"></div>
          <p class="text-sm font-medium text-earth-dark-olive">Verde Oliva</p>
          <p class="text-xs text-earth-brown">#79792E</p>
        </div>
        <div class="text-center">
          <div class="w-16 h-16 bg-earth-light-yellow rounded-lg mx-auto mb-2"></div>
          <p class="text-sm font-medium text-earth-dark-olive">Amarillo Claro</p>
          <p class="text-xs text-earth-brown">#F2DD6C</p>
        </div>
      </div>
    </div>

    <!-- Botones -->
    <div class="bg-earth-light-gray p-6 rounded-lg border border-earth-golden">
      <h2 class="text-xl font-semibold text-earth-dark-olive mb-4">Botones</h2>
      <div class="flex flex-wrap gap-4">
        <button class="btn-earth-primary">Botón Primario</button>
        <button class="btn-earth-secondary">Botón Secundario</button>
        <button class="bg-earth-olive text-earth-light-gray px-4 py-2 rounded-lg hover:bg-earth-dark-olive transition-colors">
          Botón Oliva
        </button>
        <button class="bg-earth-brown text-earth-light-gray px-4 py-2 rounded-lg hover:bg-earth-dark-olive transition-colors">
          Botón Marrón
        </button>
      </div>
    </div>

    <!-- Estados de proyecto -->
    <div class="bg-earth-light-gray p-6 rounded-lg border border-earth-golden">
      <h2 class="text-xl font-semibold text-earth-dark-olive mb-4">Estados de Proyecto</h2>
      <div class="flex flex-wrap gap-4">
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 project-status-active rounded-full"></span>
          <span class="text-earth-dark-olive">Activo</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 project-status-completed rounded-full"></span>
          <span class="text-earth-dark-olive">Completado</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 project-status-paused rounded-full"></span>
          <span class="text-earth-dark-olive">Pausado</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 project-status-cancelled rounded-full"></span>
          <span class="text-earth-dark-olive">Cancelado</span>
        </div>
      </div>
    </div>

    <!-- Tarjetas -->
    <div class="bg-earth-light-gray p-6 rounded-lg border border-earth-golden">
      <h2 class="text-xl font-semibold text-earth-dark-olive mb-4">Tarjetas</h2>
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div class="card-earth p-4">
          <h3 class="font-semibold text-earth-dark-olive mb-2">Tarjeta Ejemplo</h3>
          <p class="text-earth-brown text-sm mb-3">Esta es una tarjeta usando la nueva paleta de colores tierra.</p>
          <button class="btn-earth-primary text-sm">Ver más</button>
        </div>
        <div class="bg-earth-light-yellow p-4 rounded-lg border border-earth-golden">
          <h3 class="font-semibold text-earth-dark-olive mb-2">Tarjeta Amarilla</h3>
          <p class="text-earth-brown text-sm mb-3">Tarjeta con fondo amarillo claro de la paleta.</p>
          <button class="btn-earth-secondary text-sm">Acción</button>
        </div>
        <div class="bg-earth-olive p-4 rounded-lg">
          <h3 class="font-semibold text-earth-light-gray mb-2">Tarjeta Oliva</h3>
          <p class="text-earth-light-gray text-sm mb-3">Tarjeta con fondo verde oliva.</p>
          <button class="bg-earth-light-gray text-earth-dark-olive px-3 py-1 rounded text-sm hover:bg-earth-golden transition-colors">
            Ver
          </button>
        </div>
      </div>
    </div>

    <!-- Formularios -->
    <div class="bg-earth-light-gray p-6 rounded-lg border border-earth-golden">
      <h2 class="text-xl font-semibold text-earth-dark-olive mb-4">Formularios</h2>
      <div class="max-w-md space-y-4">
        <div>
          <label class="form-label">Nombre del Proyecto</label>
          <input type="text" class="input-earth w-full" placeholder="Ingresa el nombre">
        </div>
        <div>
          <label class="form-label">Descripción</label>
          <textarea class="input-earth w-full" rows="3" placeholder="Describe tu proyecto"></textarea>
        </div>
        <div class="flex gap-2">
          <button class="btn-earth-primary">Guardar</button>
          <button class="btn-earth-secondary">Cancelar</button>
        </div>
      </div>
    </div>

    <!-- Badges y etiquetas -->
    <div class="bg-earth-light-gray p-6 rounded-lg border border-earth-golden">
      <h2 class="text-xl font-semibold text-earth-dark-olive mb-4">Badges y Etiquetas</h2>
      <div class="flex flex-wrap gap-2">
        <span class="badge-earth-primary">Primario</span>
        <span class="badge-earth-secondary">Secundario</span>
        <span class="bg-earth-brown text-earth-light-gray px-2 py-1 rounded-full text-xs">Marrón</span>
        <span class="bg-earth-golden text-earth-dark-olive px-2 py-1 rounded-full text-xs">Dorado</span>
        <span class="bg-earth-olive text-earth-light-gray px-2 py-1 rounded-full text-xs">Oliva</span>
      </div>
    </div>

    <!-- Gradientes -->
    <div class="bg-earth-light-gray p-6 rounded-lg border border-earth-golden">
      <h2 class="text-xl font-semibold text-earth-dark-olive mb-4">Gradientes</h2>
      <div class="grid md:grid-cols-3 gap-4">
        <div class="bg-gradient-earth-warm p-6 rounded-lg text-center">
          <h3 class="font-semibold text-earth-dark-olive">Gradiente Cálido</h3>
          <p class="text-earth-brown text-sm">Amarillo a Dorado</p>
        </div>
        <div class="bg-gradient-earth-natural p-6 rounded-lg text-center">
          <h3 class="font-semibold text-earth-dark-olive">Gradiente Natural</h3>
          <p class="text-earth-brown text-sm">Gris a Oliva</p>
        </div>
        <div class="bg-gradient-earth-rich p-6 rounded-lg text-center">
          <h3 class="font-semibold text-earth-light-gray">Gradiente Rico</h3>
          <p class="text-earth-light-gray text-sm">Marrón a Verde Oscuro</p>
        </div>
      </div>
    </div>

    <!-- Barra de progreso -->
    <div class="bg-earth-light-gray p-6 rounded-lg border border-earth-golden">
      <h2 class="text-xl font-semibold text-earth-dark-olive mb-4">Barra de Progreso</h2>
      <div class="space-y-4">
        <div>
          <div class="flex justify-between text-sm text-earth-brown mb-1">
            <span>Progreso del proyecto</span>
            <span>75%</span>
          </div>
          <div class="w-full bg-earth-light-gray rounded-full h-3 border border-earth-olive">
            <div class="progress-bar-earth h-3 rounded-full" style="width: 75%"></div>
          </div>
        </div>
        <div>
          <div class="flex justify-between text-sm text-earth-brown mb-1">
            <span>Tareas completadas</span>
            <span>45%</span>
          </div>
          <div class="w-full bg-earth-light-gray rounded-full h-3 border border-earth-olive">
            <div class="progress-bar-earth h-3 rounded-full" style="width: 45%"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Este componente es solo para demostrar la paleta de colores
</script>

<style scoped>
/* Los estilos están definidos en color-palette.css */
</style>