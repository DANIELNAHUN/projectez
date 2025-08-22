/**
 * Test utilities for error handling and validation system
 */

import { useErrorHandler } from '../composables/useErrorHandler.js'
import { useFormValidation, validationRules } from '../composables/useFormValidation.js'
import { validationService } from '../services/validationService.js'
import { errorRecoveryService } from '../services/errorRecoveryService.js'
import { useNotifications } from '../services/notificationService.js'
import { ValidationError } from './validation.js'

export class ErrorHandlingTester {
  constructor() {
    this.errorHandler = useErrorHandler()
    this.notifications = useNotifications()
    this.testResults = []
  }

  // Run all tests
  async runAllTests() {
    console.log('🧪 Starting Error Handling Tests...')
    
    const tests = [
      () => this.testValidationErrors(),
      () => this.testStorageErrors(),
      () => this.testFormValidation(),
      () => this.testErrorRecovery(),
      () => this.testNotificationSystem(),
      () => this.testBusinessRules()
    ]

    for (const test of tests) {
      try {
        await test()
      } catch (error) {
        console.error('Test failed:', error)
        this.testResults.push({
          test: test.name,
          success: false,
          error: error.message
        })
      }
    }

    this.printTestResults()
    return this.testResults
  }

  // Test validation errors
  async testValidationErrors() {
    console.log('📝 Testing validation errors...')

    // Test project validation
    const invalidProject = {
      name: '', // Required field missing
      description: 'A'.repeat(600), // Too long
      startDate: 'invalid-date', // Invalid date
      endDate: new Date('2020-01-01'), // End before start
      status: 'invalid-status' // Invalid status
    }

    try {
      const result = await validationService.validateProjectData(invalidProject, {
        showNotification: false
      })
      
      this.assert(!result.isValid, 'Project validation should fail')
      this.assert(result.errors.length > 0, 'Should have validation errors')
      
      console.log('✅ Project validation test passed')
    } catch (error) {
      console.error('❌ Project validation test failed:', error)
      throw error
    }

    // Test task validation
    const invalidTask = {
      title: '', // Required field missing
      description: 'A'.repeat(1100), // Too long
      startDate: new Date('2025-01-01'),
      endDate: new Date('2024-12-31'), // End before start
      status: 'invalid-status',
      type: 'invalid-type',
      priority: 'invalid-priority',
      progress: 150, // Out of range
      level: 101 // Exceeds max nesting
    }

    try {
      const result = await validationService.validateTaskData(invalidTask, {
        showNotification: false,
        maxNestingLevel: 100
      })
      
      this.assert(!result.isValid, 'Task validation should fail')
      this.assert(result.errors.length > 0, 'Should have validation errors')
      
      console.log('✅ Task validation test passed')
    } catch (error) {
      console.error('❌ Task validation test failed:', error)
      throw error
    }

    this.testResults.push({
      test: 'testValidationErrors',
      success: true,
      message: 'Validation error tests passed'
    })
  }

  // Test storage errors
  async testStorageErrors() {
    console.log('💾 Testing storage errors...')

    // Simulate quota exceeded error
    const quotaError = new Error('QuotaExceededError: The quota has been exceeded')
    
    try {
      const errorObj = this.errorHandler.handleStorageError(quotaError, 'Test storage quota')
      
      this.assert(errorObj.type === 'storage', 'Should be classified as storage error')
      this.assert(errorObj.severity === 'critical', 'Quota error should be critical')
      
      console.log('✅ Storage quota error test passed')
    } catch (error) {
      console.error('❌ Storage quota error test failed:', error)
      throw error
    }

    // Simulate access denied error
    const accessError = new Error('Access denied to localStorage')
    
    try {
      const errorObj = this.errorHandler.handleStorageError(accessError, 'Test storage access')
      
      this.assert(errorObj.type === 'storage', 'Should be classified as storage error')
      this.assert(errorObj.severity === 'high', 'Access error should be high severity')
      
      console.log('✅ Storage access error test passed')
    } catch (error) {
      console.error('❌ Storage access error test failed:', error)
      throw error
    }

    this.testResults.push({
      test: 'testStorageErrors',
      success: true,
      message: 'Storage error tests passed'
    })
  }

  // Test form validation
  async testFormValidation() {
    console.log('📋 Testing form validation...')

    const { validateForm, validateField, hasErrors, getFieldError } = useFormValidation(validationRules.project)

    // Test field validation
    try {
      const isValid = await validateField('name', '')
      this.assert(!isValid, 'Empty name should be invalid')
      this.assert(hasErrors.value, 'Should have errors')
      this.assert(getFieldError('name'), 'Should have name error')
      
      console.log('✅ Field validation test passed')
    } catch (error) {
      console.error('❌ Field validation test failed:', error)
      throw error
    }

    // Test form validation
    const invalidFormData = {
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      status: 'active'
    }

    try {
      const isValid = await validateForm(invalidFormData)
      this.assert(!isValid, 'Invalid form should fail validation')
      this.assert(hasErrors.value, 'Should have form errors')
      
      console.log('✅ Form validation test passed')
    } catch (error) {
      console.error('❌ Form validation test failed:', error)
      throw error
    }

    this.testResults.push({
      test: 'testFormValidation',
      success: true,
      message: 'Form validation tests passed'
    })
  }

  // Test error recovery
  async testErrorRecovery() {
    console.log('🔄 Testing error recovery...')

    // Test storage quota recovery
    const quotaError = new Error('QuotaExceededError: Storage quota exceeded')
    
    try {
      const result = await errorRecoveryService.attemptRecovery(quotaError, 'Test recovery')
      
      this.assert(result.success, 'Storage quota recovery should succeed')
      this.assert(result.requiresUserAction, 'Should require user action')
      
      console.log('✅ Storage quota recovery test passed')
    } catch (error) {
      console.error('❌ Storage quota recovery test failed:', error)
      throw error
    }

    // Test validation error recovery
    const validationError = new ValidationError('Test validation error', 'testField')
    
    try {
      const result = await errorRecoveryService.attemptRecovery(validationError, 'Test validation recovery')
      
      this.assert(result.success, 'Validation error recovery should succeed')
      
      console.log('✅ Validation error recovery test passed')
    } catch (error) {
      console.error('❌ Validation error recovery test failed:', error)
      throw error
    }

    this.testResults.push({
      test: 'testErrorRecovery',
      success: true,
      message: 'Error recovery tests passed'
    })
  }

  // Test notification system
  async testNotificationSystem() {
    console.log('🔔 Testing notification system...')

    try {
      // Test success notification
      const successId = this.notifications.success('Test Success', 'This is a test success message')
      this.assert(typeof successId === 'number', 'Should return notification ID')
      
      // Test error notification
      const errorId = this.notifications.error('Test Error', 'This is a test error message')
      this.assert(typeof errorId === 'number', 'Should return notification ID')
      
      // Test validation error notification
      const validationErrors = [
        { field: 'name', message: 'Name is required' },
        { field: 'email', message: 'Invalid email format' }
      ]
      this.notifications.validationError(validationErrors, 'test form')
      
      // Test operation notifications
      this.notifications.operationSuccess('create', 'Test Entity')
      this.notifications.operationError('update', 'Test Entity', new Error('Test error'))
      
      console.log('✅ Notification system test passed')
    } catch (error) {
      console.error('❌ Notification system test failed:', error)
      throw error
    }

    this.testResults.push({
      test: 'testNotificationSystem',
      success: true,
      message: 'Notification system tests passed'
    })
  }

  // Test business rules
  async testBusinessRules() {
    console.log('📊 Testing business rules...')

    // Test project business rules
    const duplicateProject = {
      name: 'Existing Project',
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000) // Tomorrow
    }

    const context = {
      existingProjects: [
        { id: '1', name: 'Existing Project' }
      ]
    }

    try {
      const result = await validationService.validateBusinessRules(duplicateProject, 'project', context)
      
      this.assert(!result.isValid, 'Duplicate project name should fail business rules')
      this.assert(result.errors.length > 0, 'Should have business rule errors')
      
      console.log('✅ Project business rules test passed')
    } catch (error) {
      console.error('❌ Project business rules test failed:', error)
      throw error
    }

    // Test task business rules
    const invalidTask = {
      title: 'Test Task',
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000),
      level: 5
    }

    const taskContext = {
      maxNestingLevel: 3
    }

    try {
      const result = await validationService.validateBusinessRules(invalidTask, 'task', taskContext)
      
      this.assert(!result.isValid, 'Task exceeding nesting level should fail business rules')
      this.assert(result.errors.length > 0, 'Should have business rule errors')
      
      console.log('✅ Task business rules test passed')
    } catch (error) {
      console.error('❌ Task business rules test failed:', error)
      throw error
    }

    this.testResults.push({
      test: 'testBusinessRules',
      success: true,
      message: 'Business rules tests passed'
    })
  }

  // Test utility methods
  assert(condition, message) {
    if (!condition) {
      throw new Error(`Assertion failed: ${message}`)
    }
  }

  printTestResults() {
    console.log('\n📊 Test Results Summary:')
    console.log('========================')
    
    const passed = this.testResults.filter(r => r.success).length
    const failed = this.testResults.filter(r => !r.success).length
    
    console.log(`✅ Passed: ${passed}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`📈 Success Rate: ${((passed / this.testResults.length) * 100).toFixed(1)}%`)
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:')
      this.testResults.filter(r => !r.success).forEach(result => {
        console.log(`  - ${result.test}: ${result.error}`)
      })
    }
    
    console.log('\n🎉 Error Handling Test Suite Complete!')
  }

  // Simulate various error scenarios for manual testing
  simulateErrors() {
    console.log('🎭 Simulating various error scenarios...')

    // Simulate storage quota error
    setTimeout(() => {
      const quotaError = new Error('QuotaExceededError: The quota has been exceeded')
      this.errorHandler.handleStorageError(quotaError, 'Simulated quota error')
    }, 1000)

    // Simulate validation error
    setTimeout(() => {
      const validationError = new ValidationError('Simulated validation error', 'testField')
      this.errorHandler.handleValidationError(validationError, 'Simulated validation')
    }, 2000)

    // Simulate network error
    setTimeout(() => {
      const networkError = new Error('Network request failed')
      this.errorHandler.handleError(networkError, 'Simulated network error')
    }, 3000)

    // Simulate component error
    setTimeout(() => {
      const componentError = new Error('Component render failed')
      this.errorHandler.handleError(componentError, 'Simulated component error')
    }, 4000)

    console.log('🎭 Error simulation started - check notifications!')
  }

  // Get error handling statistics
  getErrorStats() {
    const recoveryStats = errorRecoveryService.getRecoveryStats()
    
    return {
      testResults: this.testResults,
      recoveryStats,
      timestamp: new Date().toISOString()
    }
  }
}

// Export test utilities
export const errorHandlingTester = new ErrorHandlingTester()

// Convenience function to run tests
export const runErrorHandlingTests = () => errorHandlingTester.runAllTests()

// Convenience function to simulate errors
export const simulateErrors = () => errorHandlingTester.simulateErrors()

// Add to window for manual testing in browser console
if (typeof window !== 'undefined') {
  window.testErrorHandling = {
    runTests: runErrorHandlingTests,
    simulateErrors: simulateErrors,
    getStats: () => errorHandlingTester.getErrorStats(),
    tester: errorHandlingTester
  }
}