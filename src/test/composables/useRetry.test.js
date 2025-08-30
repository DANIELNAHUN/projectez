/**
 * Tests for useRetry composable
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useRetry, withRetry, retryIf } from '../../composables/useRetry.js'

// Mock the dependencies
vi.mock('../../composables/useErrorHandler.js', () => ({
  useErrorHandler: () => ({
    handleError: vi.fn()
  })
}))

vi.mock('../../services/notificationService.js', () => ({
  useNotifications: () => ({
    error: vi.fn(),
    info: vi.fn()
  })
}))

describe('useRetry', () => {
  let mockFn
  let retryComposable

  beforeEach(() => {
    mockFn = vi.fn()
    retryComposable = useRetry({
      maxRetries: 3,
      baseDelay: 100
    })
    
    // Mock setTimeout to avoid actual delays in tests
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  describe('Basic Retry Logic', () => {
    it('executes function successfully on first try', async () => {
      mockFn.mockResolvedValue('success')

      const result = await retryComposable.executeWithRetry(mockFn)

      expect(result).toBe('success')
      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(retryComposable.retryCount.value).toBe(0)
    })

    it('retries on failure and succeeds', async () => {
      mockFn
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success')

      const promise = retryComposable.executeWithRetry(mockFn)
      
      // Fast-forward through delays
      await vi.runAllTimersAsync()
      
      const result = await promise

      expect(result).toBe('success')
      expect(mockFn).toHaveBeenCalledTimes(3)
      expect(retryComposable.retryCount.value).toBe(2)
    })

    it('fails after max retries', async () => {
      const error = new Error('Persistent error')
      mockFn.mockRejectedValue(error)

      const promise = retryComposable.executeWithRetry(mockFn)
      
      // Fast-forward through all delays
      await vi.runAllTimersAsync()

      await expect(promise).rejects.toThrow('Persistent error')
      expect(mockFn).toHaveBeenCalledTimes(4) // Initial + 3 retries
    })

    it('respects retry condition', async () => {
      const retryComposableWithCondition = useRetry({
        maxRetries: 3,
        retryCondition: (error) => !error.message.includes('permanent')
      })

      mockFn.mockRejectedValue(new Error('permanent failure'))

      await expect(retryComposableWithCondition.executeWithRetry(mockFn)).rejects.toThrow('permanent failure')
      expect(mockFn).toHaveBeenCalledTimes(1) // No retries
    })
  })

  describe('Delay Calculation', () => {
    it('calculates exponential backoff delays', () => {
      const retryComposable = useRetry({
        baseDelay: 1000,
        exponentialBase: 2,
        maxDelay: 10000,
        jitter: false
      })

      // Simulate retry attempts to check delay calculation
      retryComposable.retryCount.value = 0
      expect(retryComposable.nextRetryDelay.value).toBe(1000)

      retryComposable.retryCount.value = 1
      expect(retryComposable.nextRetryDelay.value).toBe(2000)

      retryComposable.retryCount.value = 2
      expect(retryComposable.nextRetryDelay.value).toBe(4000)
    })

    it('respects max delay limit', () => {
      const retryComposable = useRetry({
        baseDelay: 1000,
        exponentialBase: 2,
        maxDelay: 3000,
        jitter: false
      })

      retryComposable.retryCount.value = 5 // Would be 32000ms without limit
      expect(retryComposable.nextRetryDelay.value).toBe(3000)
    })

    it('applies jitter when enabled', () => {
      const retryComposable = useRetry({
        baseDelay: 1000,
        jitter: true
      })

      retryComposable.retryCount.value = 1
      const delay1 = retryComposable.nextRetryDelay.value
      const delay2 = retryComposable.nextRetryDelay.value

      // With jitter, delays should vary (though this test might be flaky)
      // At minimum, delay should be between 500ms and 1000ms for first retry
      expect(delay1).toBeGreaterThanOrEqual(500)
      expect(delay1).toBeLessThanOrEqual(1000)
    })
  })

  describe('State Management', () => {
    it('tracks retry state correctly', async () => {
      expect(retryComposable.isRetrying.value).toBe(false)
      expect(retryComposable.retryCount.value).toBe(0)
      expect(retryComposable.canRetry.value).toBe(true)

      mockFn.mockRejectedValue(new Error('Test error'))

      const promise = retryComposable.executeWithRetry(mockFn)
      
      // During execution, should be retrying
      await vi.advanceTimersByTimeAsync(50)
      expect(retryComposable.isRetrying.value).toBe(true)

      await vi.runAllTimersAsync()
      await expect(promise).rejects.toThrow()

      expect(retryComposable.isRetrying.value).toBe(false)
      expect(retryComposable.retryCount.value).toBe(3)
    })

    it('resets state correctly', () => {
      retryComposable.retryCount.value = 2
      retryComposable.lastError.value = new Error('Test')

      retryComposable.reset()

      expect(retryComposable.retryCount.value).toBe(0)
      expect(retryComposable.lastError.value).toBe(null)
      expect(retryComposable.isRetrying.value).toBe(false)
    })

    it('provides retry statistics', async () => {
      mockFn.mockRejectedValue(new Error('Test error'))

      const promise = retryComposable.executeWithRetry(mockFn)
      await vi.runAllTimersAsync()
      await expect(promise).rejects.toThrow()

      const stats = retryComposable.getRetryStats()
      expect(stats).toMatchObject({
        retryCount: 3,
        maxRetries: 3,
        canRetry: false,
        isRetrying: false
      })
      expect(stats.lastError).toBeInstanceOf(Error)
      expect(stats.retryHistory).toHaveLength(4) // Initial + 3 retries
    })
  })

  describe('Specialized Retry Functions', () => {
    it('retryApiCall handles network errors', async () => {
      const apiCall = vi.fn().mockRejectedValue(new Error('Network timeout'))

      const promise = retryComposable.retryApiCall(apiCall)
      await vi.runAllTimersAsync()

      await expect(promise).rejects.toThrow('Network timeout')
      expect(apiCall).toHaveBeenCalledTimes(4) // Should retry network errors
    })

    it('retryStorageOperation has fewer retries', async () => {
      const storageRetry = useRetry({ maxRetries: 2 })
      const storageOp = vi.fn().mockRejectedValue(new Error('Storage error'))

      const promise = storageRetry.retryStorageOperation(storageOp)
      await vi.runAllTimersAsync()

      await expect(promise).rejects.toThrow('Storage error')
      expect(storageOp).toHaveBeenCalledTimes(3) // Initial + 2 retries
    })

    it('does not retry quota exceeded errors', async () => {
      const storageOp = vi.fn().mockRejectedValue(new Error('Quota exceeded'))

      const promise = retryComposable.retryStorageOperation(storageOp)
      await vi.runAllTimersAsync()

      await expect(promise).rejects.toThrow('Quota exceeded')
      expect(storageOp).toHaveBeenCalledTimes(1) // No retries for quota errors
    })
  })

  describe('Manual Retry', () => {
    it('allows manual retry when possible', async () => {
      mockFn.mockResolvedValue('success')

      const result = await retryComposable.manualRetry(mockFn)

      expect(result).toBe('success')
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('prevents manual retry when max retries reached', async () => {
      // Simulate max retries reached
      retryComposable.retryCount.value = 3

      await expect(retryComposable.manualRetry(mockFn)).rejects.toThrow('Cannot retry: maximum retries reached')
      expect(mockFn).not.toHaveBeenCalled()
    })
  })

  describe('Callback Functions', () => {
    it('calls onRetry callback before each retry', async () => {
      const onRetry = vi.fn()
      const retryWithCallback = useRetry({
        maxRetries: 2,
        baseDelay: 100,
        onRetry
      })

      mockFn.mockRejectedValue(new Error('Test error'))

      const promise = retryWithCallback.executeWithRetry(mockFn)
      await vi.runAllTimersAsync()

      await expect(promise).rejects.toThrow()
      expect(onRetry).toHaveBeenCalledTimes(2)
      expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 1)
      expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 2)
    })

    it('calls onMaxRetriesReached when retries exhausted', async () => {
      const onMaxRetriesReached = vi.fn()
      const retryWithCallback = useRetry({
        maxRetries: 1,
        baseDelay: 100,
        onMaxRetriesReached
      })

      const error = new Error('Test error')
      mockFn.mockRejectedValue(error)

      const promise = retryWithCallback.executeWithRetry(mockFn)
      await vi.runAllTimersAsync()

      await expect(promise).rejects.toThrow()
      expect(onMaxRetriesReached).toHaveBeenCalledWith(error, 1)
    })
  })
})

describe('withRetry decorator', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('creates a retry wrapper for a function', async () => {
    const originalFn = vi.fn().mockResolvedValue('success')
    const wrappedFn = withRetry(originalFn, { maxRetries: 2 })

    const result = await wrappedFn('arg1', 'arg2')

    expect(result).toBe('success')
    expect(originalFn).toHaveBeenCalledWith('arg1', 'arg2')
  })

  it('retries wrapped function on failure', async () => {
    const originalFn = vi.fn()
      .mockRejectedValueOnce(new Error('Temporary error'))
      .mockResolvedValue('success')

    const wrappedFn = withRetry(originalFn, { maxRetries: 2, baseDelay: 100 })

    const promise = wrappedFn()
    await vi.runAllTimersAsync()
    const result = await promise

    expect(result).toBe('success')
    expect(originalFn).toHaveBeenCalledTimes(2)
  })
})

describe('retryIf conditional retry', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('retries only when condition is met', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('Network error'))
    const condition = (error) => error.message.includes('Network')

    const wrappedFn = retryIf(condition, fn, { maxRetries: 2, baseDelay: 100 })

    const promise = wrappedFn()
    await vi.runAllTimersAsync()

    await expect(promise).rejects.toThrow('Network error')
    expect(fn).toHaveBeenCalledTimes(3) // Initial + 2 retries
  })

  it('does not retry when condition is not met', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('Validation error'))
    const condition = (error) => error.message.includes('Network')

    const wrappedFn = retryIf(condition, fn, { maxRetries: 2 })

    await expect(wrappedFn()).rejects.toThrow('Validation error')
    expect(fn).toHaveBeenCalledTimes(1) // No retries
  })

  it('supports function conditions', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('Temporary error'))
    const condition = vi.fn().mockReturnValue(true)

    const wrappedFn = retryIf(condition, fn, { maxRetries: 1, baseDelay: 100 })

    const promise = wrappedFn()
    await vi.runAllTimersAsync()

    await expect(promise).rejects.toThrow('Temporary error')
    expect(condition).toHaveBeenCalledWith(expect.any(Error))
    expect(fn).toHaveBeenCalledTimes(2)
  })
})