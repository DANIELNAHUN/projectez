/**
 * End-to-End Test Runner for AI Project Generator
 * Executes all integration tests and generates comprehensive reports
 */

import { execSync } from 'child_process'
import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

class E2ETestRunner {
  constructor() {
    this.testResults = {
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        skippedTests: 0,
        totalTime: 0,
        startTime: null,
        endTime: null
      },
      testSuites: [],
      performanceMetrics: {
        averageTestTime: 0,
        slowestTest: null,
        fastestTest: null,
        memoryUsage: null
      },
      coverage: {
        statements: 0,
        branches: 0,
        functions: 0,
        lines: 0
      },
      errors: [],
      warnings: []
    }
  }

  /**
   * Run all end-to-end integration tests
   */
  async runAllTests() {
    console.log('🚀 Starting AI Project Generator End-to-End Tests...\n')
    
    this.testResults.summary.startTime = new Date()

    const testSuites = [
      {
        name: 'AI Project Generator E2E',
        file: 'ai-project-generator-e2e.test.js',
        description: 'Complete workflow tests for AI generation, export/import, and date adjustments'
      },
      {
        name: 'Performance Tests',
        file: 'performance-tests.test.js',
        description: 'Performance and stress tests for large project operations'
      },
      {
        name: 'Error Recovery E2E',
        file: 'error-recovery-e2e.test.js',
        description: 'Comprehensive error handling and recovery scenarios'
      }
    ]

    for (const suite of testSuites) {
      await this.runTestSuite(suite)
    }

    this.testResults.summary.endTime = new Date()
    this.testResults.summary.totalTime = this.testResults.summary.endTime - this.testResults.summary.startTime

    this.calculateMetrics()
    this.generateReport()
    this.displaySummary()

    return this.testResults
  }

  /**
   * Run a specific test suite
   */
  async runTestSuite(suite) {
    console.log(`📋 Running ${suite.name}...`)
    console.log(`   ${suite.description}`)

    const suiteResult = {
      name: suite.name,
      file: suite.file,
      description: suite.description,
      startTime: new Date(),
      endTime: null,
      duration: 0,
      tests: [],
      passed: 0,
      failed: 0,
      skipped: 0,
      errors: [],
      warnings: []
    }

    try {
      const testCommand = `npx vitest run src/test/integration/${suite.file} --reporter=json`
      const output = execSync(testCommand, { 
        encoding: 'utf8',
        timeout: 300000, // 5 minutes timeout
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      })

      const testOutput = this.parseVitestOutput(output)
      this.processTestResults(suiteResult, testOutput)

    } catch (error) {
      console.error(`❌ Error running ${suite.name}:`, error.message)
      suiteResult.errors.push({
        message: error.message,
        stack: error.stack,
        timestamp: new Date()
      })
      suiteResult.failed = 1
    }

    suiteResult.endTime = new Date()
    suiteResult.duration = suiteResult.endTime - suiteResult.startTime

    this.testResults.testSuites.push(suiteResult)
    this.updateSummary(suiteResult)

    console.log(`   ✅ Completed in ${suiteResult.duration}ms`)
    console.log(`   📊 Passed: ${suiteResult.passed}, Failed: ${suiteResult.failed}, Skipped: ${suiteResult.skipped}\n`)
  }

  /**
   * Parse Vitest JSON output
   */
  parseVitestOutput(output) {
    try {
      // Extract JSON from output (Vitest may include other text)
      const jsonMatch = output.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      return { testResults: [] }
    } catch (error) {
      console.warn('⚠️  Could not parse test output as JSON:', error.message)
      return { testResults: [] }
    }
  }

  /**
   * Process test results from Vitest output
   */
  processTestResults(suiteResult, testOutput) {
    if (testOutput.testResults && Array.isArray(testOutput.testResults)) {
      testOutput.testResults.forEach(testFile => {
        if (testFile.assertionResults) {
          testFile.assertionResults.forEach(test => {
            const testResult = {
              name: test.title || test.fullName,
              status: test.status,
              duration: test.duration || 0,
              error: test.failureMessages ? test.failureMessages.join('\n') : null
            }

            suiteResult.tests.push(testResult)

            switch (test.status) {
              case 'passed':
                suiteResult.passed++
                break
              case 'failed':
                suiteResult.failed++
                if (testResult.error) {
                  suiteResult.errors.push({
                    test: testResult.name,
                    error: testResult.error,
                    timestamp: new Date()
                  })
                }
                break
              case 'skipped':
              case 'pending':
                suiteResult.skipped++
                break
            }
          })
        }
      })
    }
  }

  /**
   * Update overall summary with suite results
   */
  updateSummary(suiteResult) {
    this.testResults.summary.totalTests += suiteResult.passed + suiteResult.failed + suiteResult.skipped
    this.testResults.summary.passedTests += suiteResult.passed
    this.testResults.summary.failedTests += suiteResult.failed
    this.testResults.summary.skippedTests += suiteResult.skipped

    this.testResults.errors.push(...suiteResult.errors)
  }

  /**
   * Calculate performance metrics
   */
  calculateMetrics() {
    const allTests = this.testResults.testSuites.flatMap(suite => suite.tests)
    
    if (allTests.length > 0) {
      const totalTestTime = allTests.reduce((sum, test) => sum + (test.duration || 0), 0)
      this.testResults.performanceMetrics.averageTestTime = totalTestTime / allTests.length

      const sortedByDuration = allTests.sort((a, b) => (b.duration || 0) - (a.duration || 0))
      this.testResults.performanceMetrics.slowestTest = sortedByDuration[0]
      this.testResults.performanceMetrics.fastestTest = sortedByDuration[sortedByDuration.length - 1]
    }

    // Memory usage (if available)
    if (typeof process !== 'undefined' && process.memoryUsage) {
      this.testResults.performanceMetrics.memoryUsage = process.memoryUsage()
    }
  }

  /**
   * Generate comprehensive test report
   */
  generateReport() {
    const reportDir = 'test-reports'
    if (!existsSync(reportDir)) {
      mkdirSync(reportDir, { recursive: true })
    }

    // Generate JSON report
    const jsonReport = {
      ...this.testResults,
      generatedAt: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      }
    }

    writeFileSync(
      join(reportDir, 'e2e-test-results.json'),
      JSON.stringify(jsonReport, null, 2)
    )

    // Generate HTML report
    const htmlReport = this.generateHTMLReport(jsonReport)
    writeFileSync(
      join(reportDir, 'e2e-test-report.html'),
      htmlReport
    )

    // Generate markdown summary
    const markdownReport = this.generateMarkdownReport(jsonReport)
    writeFileSync(
      join(reportDir, 'e2e-test-summary.md'),
      markdownReport
    )

    console.log(`📄 Reports generated in ${reportDir}/`)
  }

  /**
   * Generate HTML report
   */
  generateHTMLReport(data) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Project Generator - E2E Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: #f8f9fa; padding: 15px; border-radius: 6px; text-align: center; }
        .metric h3 { margin: 0 0 10px 0; color: #333; }
        .metric .value { font-size: 24px; font-weight: bold; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .skipped { color: #ffc107; }
        .suite { margin-bottom: 30px; border: 1px solid #ddd; border-radius: 6px; }
        .suite-header { background: #e9ecef; padding: 15px; border-bottom: 1px solid #ddd; }
        .suite-content { padding: 15px; }
        .test { padding: 10px; border-bottom: 1px solid #eee; }
        .test:last-child { border-bottom: none; }
        .test-passed { border-left: 4px solid #28a745; }
        .test-failed { border-left: 4px solid #dc3545; }
        .test-skipped { border-left: 4px solid #ffc107; }
        .error { background: #f8d7da; color: #721c24; padding: 10px; border-radius: 4px; margin-top: 10px; }
        .performance { background: #d1ecf1; padding: 15px; border-radius: 6px; margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>AI Project Generator - End-to-End Test Report</h1>
            <p>Generated on ${new Date(data.generatedAt).toLocaleString()}</p>
        </div>

        <div class="summary">
            <div class="metric">
                <h3>Total Tests</h3>
                <div class="value">${data.summary.totalTests}</div>
            </div>
            <div class="metric">
                <h3>Passed</h3>
                <div class="value passed">${data.summary.passedTests}</div>
            </div>
            <div class="metric">
                <h3>Failed</h3>
                <div class="value failed">${data.summary.failedTests}</div>
            </div>
            <div class="metric">
                <h3>Skipped</h3>
                <div class="value skipped">${data.summary.skippedTests}</div>
            </div>
            <div class="metric">
                <h3>Total Time</h3>
                <div class="value">${data.summary.totalTime}ms</div>
            </div>
            <div class="metric">
                <h3>Success Rate</h3>
                <div class="value passed">${((data.summary.passedTests / data.summary.totalTests) * 100).toFixed(1)}%</div>
            </div>
        </div>

        <div class="performance">
            <h3>Performance Metrics</h3>
            <p><strong>Average Test Time:</strong> ${data.performanceMetrics.averageTestTime?.toFixed(2) || 'N/A'}ms</p>
            <p><strong>Slowest Test:</strong> ${data.performanceMetrics.slowestTest?.name || 'N/A'} (${data.performanceMetrics.slowestTest?.duration || 0}ms)</p>
            <p><strong>Fastest Test:</strong> ${data.performanceMetrics.fastestTest?.name || 'N/A'} (${data.performanceMetrics.fastestTest?.duration || 0}ms)</p>
        </div>

        ${data.testSuites.map(suite => `
            <div class="suite">
                <div class="suite-header">
                    <h2>${suite.name}</h2>
                    <p>${suite.description}</p>
                    <p><strong>Duration:</strong> ${suite.duration}ms | <strong>Passed:</strong> ${suite.passed} | <strong>Failed:</strong> ${suite.failed} | <strong>Skipped:</strong> ${suite.skipped}</p>
                </div>
                <div class="suite-content">
                    ${suite.tests.map(test => `
                        <div class="test test-${test.status}">
                            <strong>${test.name}</strong>
                            <span style="float: right;">${test.duration || 0}ms</span>
                            ${test.error ? `<div class="error">${test.error}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('')}

        ${data.errors.length > 0 ? `
            <div class="suite">
                <div class="suite-header">
                    <h2>Errors Summary</h2>
                </div>
                <div class="suite-content">
                    ${data.errors.map(error => `
                        <div class="error">
                            <strong>${error.test || 'General Error'}:</strong> ${error.error || error.message}
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}
    </div>
</body>
</html>
    `
  }

  /**
   * Generate markdown report
   */
  generateMarkdownReport(data) {
    const successRate = ((data.summary.passedTests / data.summary.totalTests) * 100).toFixed(1)
    
    return `# AI Project Generator - End-to-End Test Report

Generated on: ${new Date(data.generatedAt).toLocaleString()}

## Summary

| Metric | Value |
|--------|-------|
| Total Tests | ${data.summary.totalTests} |
| Passed | ${data.summary.passedTests} |
| Failed | ${data.summary.failedTests} |
| Skipped | ${data.summary.skippedTests} |
| Success Rate | ${successRate}% |
| Total Time | ${data.summary.totalTime}ms |

## Performance Metrics

- **Average Test Time:** ${data.performanceMetrics.averageTestTime?.toFixed(2) || 'N/A'}ms
- **Slowest Test:** ${data.performanceMetrics.slowestTest?.name || 'N/A'} (${data.performanceMetrics.slowestTest?.duration || 0}ms)
- **Fastest Test:** ${data.performanceMetrics.fastestTest?.name || 'N/A'} (${data.performanceMetrics.fastestTest?.duration || 0}ms)

## Test Suites

${data.testSuites.map(suite => `
### ${suite.name}

${suite.description}

- **Duration:** ${suite.duration}ms
- **Passed:** ${suite.passed}
- **Failed:** ${suite.failed}
- **Skipped:** ${suite.skipped}

${suite.tests.length > 0 ? `
#### Tests

${suite.tests.map(test => `
- ${test.status === 'passed' ? '✅' : test.status === 'failed' ? '❌' : '⏭️'} **${test.name}** (${test.duration || 0}ms)${test.error ? `\n  \`\`\`\n  ${test.error}\n  \`\`\`` : ''}
`).join('')}
` : ''}
`).join('')}

${data.errors.length > 0 ? `
## Errors

${data.errors.map(error => `
### ${error.test || 'General Error'}

\`\`\`
${error.error || error.message}
\`\`\`
`).join('')}
` : ''}

## Environment

- **Node Version:** ${data.environment.nodeVersion}
- **Platform:** ${data.environment.platform}
- **Architecture:** ${data.environment.arch}
`
  }

  /**
   * Display test summary in console
   */
  displaySummary() {
    const { summary, performanceMetrics } = this.testResults
    const successRate = ((summary.passedTests / summary.totalTests) * 100).toFixed(1)

    console.log('\n' + '='.repeat(60))
    console.log('🎯 AI PROJECT GENERATOR - E2E TEST SUMMARY')
    console.log('='.repeat(60))
    console.log(`📊 Total Tests: ${summary.totalTests}`)
    console.log(`✅ Passed: ${summary.passedTests}`)
    console.log(`❌ Failed: ${summary.failedTests}`)
    console.log(`⏭️  Skipped: ${summary.skippedTests}`)
    console.log(`🎯 Success Rate: ${successRate}%`)
    console.log(`⏱️  Total Time: ${summary.totalTime}ms`)
    
    if (performanceMetrics.averageTestTime) {
      console.log(`📈 Average Test Time: ${performanceMetrics.averageTestTime.toFixed(2)}ms`)
    }
    
    if (summary.failedTests > 0) {
      console.log('\n❌ FAILED TESTS:')
      this.testResults.errors.forEach(error => {
        console.log(`   • ${error.test || 'Unknown Test'}: ${error.error || error.message}`)
      })
    }

    console.log('\n' + '='.repeat(60))
    
    if (summary.failedTests === 0) {
      console.log('🎉 ALL TESTS PASSED! The AI Project Generator is working correctly.')
    } else {
      console.log(`⚠️  ${summary.failedTests} test(s) failed. Please review the errors above.`)
    }
    
    console.log('='.repeat(60) + '\n')
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const runner = new E2ETestRunner()
  runner.runAllTests().catch(error => {
    console.error('❌ Test runner failed:', error)
    process.exit(1)
  })
}

export { E2ETestRunner }