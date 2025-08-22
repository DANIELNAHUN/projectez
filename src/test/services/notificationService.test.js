import { describe, it, expect, beforeEach, vi } from 'vitest'
import { notificationService, useNotifications } from '../../services/notificationService.js'

// Mock the toast composable
const mockToast = {
  success: vi.fn(() => 'toast-id'),
  error: vi.fn(() => 'toast-id'),
  warning: vi.fn(() => 'toast-id'),
  info: vi.fn(() => 'toast-id'),
  close: vi.fn(),
  closeAll: vi.fn(),
  toasts: []
}

vi.mock('../../composables/useToast.js', () => ({
  useToast: () => mockToast
}))

describe('NotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    notificationService.notificationQueue = []
    notificationService.isProcessingQueue = false
  })

  describe('basic notifications', () => {
    it('should show success notification', () => {
      const result = notificationService.success('Test Title', 'Test Message')
      
      expect(mockToast.success).toHaveBeenCalledWith('Test Title', 'Test Message', {
        icon: 'pi pi-check-circle',
        duration: 4000
      })
      expect(result).toBe('toast-id')
    })

    it('should show error notification', () => {
      const result = notificationService.error('Error Title', 'Error Message')
      
      expect(mockToast.error).toHaveBeenCalledWith('Error Title', 'Error Message', {
        icon: 'pi pi-exclamation-triangle',
        duration: 8000,
        persistent: false,
        actions: null
      })
      expect(result).toBe('toast-id')
    })

    it('should show warning notification', () => {
      const result = notificationService.warning('Warning Title', 'Warning Message')
      
      expect(mockToast.warning).toHaveBeenCalledWith('Warning Title', 'Warning Message', {
        icon: 'pi pi-exclamation-circle',
        duration: 6000
      })
      expect(result).toBe('toast-id')
    })

    it('should show info notification', () => {
      const result = notificationService.info('Info Title', 'Info Message')
      
      expect(mockToast.info).toHaveBeenCalledWith('Info Title', 'Info Message', {
        icon: 'pi pi-info-circle',
        duration: 5000
      })
      expect(result).toBe('toast-id')
    })
  })

  describe('operation notifications', () => {
    it('should show operation success notification', () => {
      notificationService.operationSuccess('create', 'proyecto')
      
      expect(mockToast.success).toHaveBeenCalledWith(
        'Operación Exitosa',
        'proyecto creado exitosamente',
        expect.any(Object)
      )
    })

    it('should show operation error notification', () => {
      const error = new Error('Test error')
      notificationService.operationError('save', 'proyecto', error)
      
      expect(mockToast.error).toHaveBeenCalledWith(
        'Error al guardar proyecto',
        'Test error',
        expect.objectContaining({ persistent: true })
      )
    })

    it('should handle unknown operation', () => {
      notificationService.operationSuccess('unknown', 'entity')
      
      expect(mockToast.success).toHaveBeenCalledWith(
        'Operación Exitosa',
        'Operación completada exitosamente',
        expect.any(Object)
      )
    })
  })

  describe('validation notifications', () => {
    it('should show validation error for array of errors', () => {
      const errors = [
        { field: 'name', message: 'Name is required' },
        { field: 'email', message: 'Invalid email' }
      ]
      
      notificationService.validationError(errors, 'formulario')
      
      expect(mockToast.error).toHaveBeenCalledWith(
        'Errores de Validación',
        'Se encontraron 2 errores en el formulario',
        expect.objectContaining({
          actions: expect.arrayContaining([
            expect.objectContaining({ label: 'Ver Detalles' })
          ])
        })
      )
    })

    it('should show validation error for single error', () => {
      const error = { message: 'Single validation error' }
      
      notificationService.validationError(error)
      
      expect(mockToast.error).toHaveBeenCalledWith(
        'Error de Validación',
        'Single validation error',
        expect.any(Object)
      )
    })

    it('should show validation details', () => {
      const errors = [
        { field: 'name', message: 'Name is required' },
        { field: 'email', message: 'Invalid email' }
      ]
      
      notificationService.showValidationDetails(errors)
      
      expect(mockToast.info).toHaveBeenCalledWith(
        'Detalles de Validación',
        '1. name: Name is required\n2. email: Invalid email',
        expect.objectContaining({ duration: 10000 })
      )
    })
  })

  describe('storage notifications', () => {
    it('should show storage quota exceeded notification', () => {
      notificationService.storageQuotaExceeded()
      
      expect(mockToast.error).toHaveBeenCalledWith(
        'Almacenamiento Lleno',
        'El espacio de almacenamiento local está lleno. Exporta y limpia datos antiguos.',
        expect.objectContaining({
          persistent: true,
          actions: expect.arrayContaining([
            expect.objectContaining({ label: 'Exportar Datos' }),
            expect.objectContaining({ label: 'Limpiar Datos' })
          ])
        })
      )
    })

    it('should handle quota error in storageError', () => {
      const error = new Error('Quota exceeded error')
      
      notificationService.storageError(error)
      
      expect(mockToast.error).toHaveBeenCalledWith(
        'Almacenamiento Lleno',
        expect.any(String),
        expect.any(Object)
      )
    })

    it('should handle generic storage error', () => {
      const error = new Error('Generic storage error')
      
      notificationService.storageError(error)
      
      expect(mockToast.error).toHaveBeenCalledWith(
        'Error de Almacenamiento',
        'No se pudieron guardar los datos. Intenta exportar como respaldo.',
        expect.objectContaining({
          actions: expect.arrayContaining([
            expect.objectContaining({ label: 'Exportar Respaldo' })
          ])
        })
      )
    })
  })

  describe('progress notifications', () => {
    it('should show progress notification', () => {
      const result = notificationService.showProgress('Processing', 'Please wait...', 50)
      
      expect(mockToast.info).toHaveBeenCalledWith('Processing', 'Please wait...', {
        persistent: true,
        showProgress: true,
        progress: 50,
        closable: false
      })
      expect(result).toBe('toast-id')
    })

    it('should update progress', () => {
      const mockToastInstance = {
        instance: { updateProgress: vi.fn() }
      }
      mockToast.toasts = [{ id: 'toast-id', ...mockToastInstance }]
      
      notificationService.updateProgress('toast-id', 75, 'Updated message')
      
      expect(mockToastInstance.instance.updateProgress).toHaveBeenCalledWith(75, 'Updated message')
    })

    it('should complete progress', () => {
      notificationService.completeProgress('toast-id', 'Success message')
      
      expect(mockToast.close).toHaveBeenCalledWith('toast-id')
      expect(mockToast.success).toHaveBeenCalledWith('Completado', 'Success message')
    })
  })

  describe('batch operations', () => {
    it('should start batch operation', () => {
      const result = notificationService.batchOperationStart('Importando', 5)
      
      expect(mockToast.info).toHaveBeenCalledWith(
        'Importando en Lote',
        'Procesando 5 elementos...',
        expect.objectContaining({
          persistent: true,
          showProgress: true,
          progress: 0
        })
      )
      expect(result).toBe('toast-id')
    })

    it('should update batch operation progress', () => {
      const mockToastInstance = {
        instance: { updateProgress: vi.fn() }
      }
      mockToast.toasts = [{ id: 'toast-id', ...mockToastInstance }]
      
      notificationService.batchOperationProgress('toast-id', 3, 5, 'elemento')
      
      expect(mockToastInstance.instance.updateProgress).toHaveBeenCalledWith(
        60,
        '3 de 5 elementos procesados'
      )
    })

    it('should complete batch operation successfully', () => {
      notificationService.batchOperationComplete('toast-id', 'elemento', 5, 0)
      
      expect(mockToast.close).toHaveBeenCalledWith('toast-id')
      expect(mockToast.success).toHaveBeenCalledWith(
        'Operación Completada',
        '5 elementos procesados exitosamente'
      )
    })

    it('should complete batch operation with errors', () => {
      notificationService.batchOperationComplete('toast-id', 'elemento', 3, 2)
      
      expect(mockToast.close).toHaveBeenCalledWith('toast-id')
      expect(mockToast.warning).toHaveBeenCalledWith(
        'Operación Completada con Errores',
        '3 exitosos, 2 errores'
      )
    })
  })

  describe('confirmation notifications', () => {
    it('should show confirmation notification', () => {
      const onConfirm = vi.fn()
      const onCancel = vi.fn()
      
      notificationService.confirmAction('Confirm Title', 'Confirm Message', onConfirm, onCancel)
      
      expect(mockToast.warning).toHaveBeenCalledWith(
        'Confirm Title',
        'Confirm Message',
        expect.objectContaining({
          persistent: true,
          actions: expect.arrayContaining([
            expect.objectContaining({ label: 'Confirmar', style: 'danger' }),
            expect.objectContaining({ label: 'Cancelar' })
          ])
        })
      )
    })
  })

  describe('system notifications', () => {
    it('should show system maintenance notification', () => {
      notificationService.systemMaintenance('Custom maintenance message')
      
      expect(mockToast.warning).toHaveBeenCalledWith(
        'Mantenimiento del Sistema',
        'Custom maintenance message',
        expect.objectContaining({
          persistent: true,
          icon: 'pi pi-wrench'
        })
      )
    })

    it('should show connection lost notification', () => {
      notificationService.connectionLost()
      
      expect(mockToast.error).toHaveBeenCalledWith(
        'Conexión Perdida',
        'Se perdió la conexión. Algunos datos pueden no guardarse.',
        expect.objectContaining({
          persistent: true,
          icon: 'pi pi-wifi'
        })
      )
    })

    it('should show connection restored notification', () => {
      notificationService.connectionRestored()
      
      expect(mockToast.success).toHaveBeenCalledWith(
        'Conexión Restaurada',
        'La conexión se ha restablecido correctamente.',
        expect.objectContaining({
          icon: 'pi pi-wifi'
        })
      )
    })
  })

  describe('queue management', () => {
    it('should add notification to queue', () => {
      const notification = {
        type: 'success',
        title: 'Test',
        message: 'Message',
        options: {}
      }
      
      notificationService.addToQueue(notification)
      
      expect(notificationService.notificationQueue).toContain(notification)
    })

    it('should process queue', async () => {
      const notifications = [
        { type: 'success', title: 'Test 1', message: 'Message 1', options: {} },
        { type: 'info', title: 'Test 2', message: 'Message 2', options: {} }
      ]
      
      notificationService.notificationQueue = [...notifications]
      
      await notificationService.processQueue()
      
      expect(mockToast.success).toHaveBeenCalledWith('Test 1', 'Message 1', {})
      expect(mockToast.info).toHaveBeenCalledWith('Test 2', 'Message 2', {})
      expect(notificationService.notificationQueue).toHaveLength(0)
    })
  })

  describe('helper methods', () => {
    it('should trigger data export', () => {
      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent')
      
      notificationService.triggerDataExport()
      
      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'trigger-data-export'
        })
      )
    })

    it('should trigger data cleanup', () => {
      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent')
      
      notificationService.triggerDataCleanup()
      
      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'trigger-data-cleanup'
        })
      )
    })

    it('should clear all notifications', () => {
      notificationService.notificationQueue = [{ type: 'test' }]
      
      notificationService.clearAll()
      
      expect(mockToast.closeAll).toHaveBeenCalled()
      expect(notificationService.notificationQueue).toHaveLength(0)
    })
  })
})

describe('useNotifications composable', () => {
  it('should provide notification methods', () => {
    const notifications = useNotifications()
    
    expect(notifications).toHaveProperty('notify')
    expect(notifications).toHaveProperty('success')
    expect(notifications).toHaveProperty('error')
    expect(notifications).toHaveProperty('warning')
    expect(notifications).toHaveProperty('info')
    expect(notifications).toHaveProperty('operationSuccess')
    expect(notifications).toHaveProperty('operationError')
    expect(notifications).toHaveProperty('validationError')
    expect(notifications).toHaveProperty('storageError')
    expect(notifications).toHaveProperty('showProgress')
    expect(notifications).toHaveProperty('updateProgress')
    expect(notifications).toHaveProperty('completeProgress')
  })

  it('should call notification service methods', () => {
    const notifications = useNotifications()
    
    notifications.success('Test Title', 'Test Message')
    
    expect(mockToast.success).toHaveBeenCalledWith('Test Title', 'Test Message', expect.any(Object))
  })
})