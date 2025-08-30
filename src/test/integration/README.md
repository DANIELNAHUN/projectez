# AI Project Generator - End-to-End Integration Tests

This directory contains comprehensive end-to-end integration tests for the AI Project Generator feature. These tests validate complete workflows, performance characteristics, and error handling scenarios.

## Test Structure

### 1. AI Project Generator E2E Tests (`ai-project-generator-e2e.test.js`)

**Purpose:** Tests complete workflows including AI generation, export/import, and date adjustments.

**Test Categories:**
- **Complete AI Project Generation Workflow**
  - Generate project from prompt and import successfully
  - Handle AI generation errors gracefully
  - Handle complex project generation with multiple retries

- **Export/Import Round-Trip Functionality**
  - Export and import project maintaining data integrity
  - Handle import validation errors
  - Preserve task hierarchy and deliverables in round-trip

- **Project Date Adjustment Scenarios**
  - Adjust all task dates when project start date changes
  - Maintain task durations during date adjustment
  - Handle date adjustment with working days calculation

- **Error Handling and Recovery Scenarios**
  - Handle OpenAI API failures with retry mechanism
  - Handle import recovery with auto-fix
  - Handle network failures during export
  - Validate project structure before operations

- **All Requirements Validation**
  - Validate all requirements are met in complete workflow
  - Handle all error scenarios mentioned in requirements

### 2. Performance Tests (`performance-tests.test.js`)

**Purpose:** Tests performance characteristics of large project operations.

**Test Categories:**
- **Export Performance Tests**
  - Export large project (100 tasks) within performance threshold
  - Export very large project (1000 tasks) within acceptable time
  - Handle concurrent exports without performance degradation

- **Import Performance Tests**
  - Import large project (100 tasks) within performance threshold
  - Import very large project (1000 tasks) within acceptable time
  - Handle import with date adjustment efficiently
  - Validate large project efficiently

- **Date Calculation Performance Tests**
  - Calculate working days for large date ranges efficiently
  - Handle bulk date adjustments efficiently
  - Validate date ranges for large datasets efficiently

- **AI Generation Performance Tests**
  - Handle large AI response processing efficiently
  - Validate large AI-generated projects efficiently

- **Memory Usage Tests**
  - Not cause memory leaks during large operations
  - Handle concurrent operations without excessive memory usage

- **Stress Tests**
  - Handle extreme project sizes gracefully
  - Handle rapid successive operations

### 3. Error Recovery E2E Tests (`error-recovery-e2e.test.js`)

**Purpose:** Tests comprehensive error scenarios and recovery mechanisms.

**Test Categories:**
- **OpenAI Service Error Handling**
  - Handle API quota exceeded error with proper messaging
  - Handle invalid API key error without retries
  - Handle rate limit exceeded with exponential backoff
  - Handle network errors with retry mechanism
  - Handle malformed AI responses gracefully
  - Validate AI responses comprehensively

- **Project Export Error Handling**
  - Handle export of invalid project gracefully
  - Validate project structure before export
  - Handle file download errors gracefully
  - Sanitize filenames properly

- **Project Import Error Handling**
  - Handle various JSON format errors
  - Validate project structure comprehensively
  - Handle date validation errors
  - Handle date range validation
  - Handle corrupted task data
  - Handle corrupted team member data
  - Attempt auto-fix for common issues
  - Provide recovery suggestions for specific errors
  - Handle import recovery strategies

- **Date Calculation Error Handling**
  - Handle invalid date inputs gracefully
  - Handle edge cases in date calculations
  - Validate date ranges correctly

- **Comprehensive Error Recovery Workflows**
  - Handle complete workflow failure and recovery
  - Handle cascading failures with graceful degradation
  - Maintain data integrity during error recovery
  - Provide comprehensive error reporting

- **User Experience Error Handling**
  - Provide user-friendly error messages
  - Provide actionable recovery suggestions
  - Handle progressive error disclosure

## Running the Tests

### Individual Test Suites

```bash
# Run AI Project Generator E2E tests
npm run test:e2e

# Run Performance tests
npm run test:performance

# Run Error Recovery tests
npm run test:error-recovery

# Run all integration tests
npm run test:integration
```

### Comprehensive Test Runner

```bash
# Run all E2E tests with comprehensive reporting
npm run test:e2e-all
```

This command will:
- Execute all three test suites sequentially
- Generate performance metrics
- Create comprehensive reports (JSON, HTML, Markdown)
- Display a detailed summary

### Individual Test Commands

```bash
# Run specific test file
npx vitest run src/test/integration/ai-project-generator-e2e.test.js

# Run with coverage
npx vitest run src/test/integration/ --coverage

# Run with UI
npx vitest src/test/integration/ --ui

# Run in watch mode
npx vitest src/test/integration/
```

## Test Reports

When running the comprehensive test runner (`npm run test:e2e-all`), reports are generated in the `test-reports/` directory:

- **`e2e-test-results.json`** - Detailed JSON results with all test data
- **`e2e-test-report.html`** - Interactive HTML report with visual metrics
- **`e2e-test-summary.md`** - Markdown summary for documentation

## Performance Benchmarks

### Expected Performance Thresholds

| Operation | Small Project (10 tasks) | Large Project (100 tasks) | Very Large Project (1000 tasks) |
|-----------|---------------------------|----------------------------|----------------------------------|
| Export | < 100ms | < 1000ms | < 5000ms |
| Import | < 200ms | < 2000ms | < 10000ms |
| Date Adjustment | < 50ms | < 500ms | < 2000ms |
| AI Generation | < 5000ms | < 10000ms | < 30000ms |
| Validation | < 50ms | < 500ms | < 1000ms |

### Memory Usage Limits

- **Single Operation:** < 50MB additional memory
- **Concurrent Operations:** < 200MB additional memory
- **Memory Leaks:** < 100MB increase after 50 iterations

## Error Scenarios Covered

### OpenAI API Errors
- ✅ Quota exceeded
- ✅ Invalid API key
- ✅ Rate limit exceeded
- ✅ Network errors
- ✅ Malformed responses
- ✅ Service unavailable

### Data Validation Errors
- ✅ Invalid JSON format
- ✅ Missing required fields
- ✅ Invalid date formats
- ✅ Invalid date ranges
- ✅ Corrupted task data
- ✅ Corrupted team member data

### System Errors
- ✅ File system errors
- ✅ Memory limitations
- ✅ Network failures
- ✅ Concurrent operation conflicts

### Recovery Mechanisms
- ✅ Automatic retry with exponential backoff
- ✅ Auto-fix for common data issues
- ✅ Graceful degradation
- ✅ User-friendly error messages
- ✅ Actionable recovery suggestions

## Requirements Coverage

These tests validate all requirements from the AI Project Generator specification:

### Requirement 1: Automatic Duration Calculation
- ✅ Calculate duration from start/end dates
- ✅ Recalculate on date changes
- ✅ Validate date ranges

### Requirement 2: Duration-Based Date Calculation
- ✅ Calculate end date from duration
- ✅ Support adjustStartDate flag
- ✅ Working days calculation

### Requirement 3: Project-Wide Date Adjustment
- ✅ Adjust all task dates proportionally
- ✅ Maintain task durations
- ✅ Recalculate end dates

### Requirement 4: JSON Export
- ✅ Generate complete JSON export
- ✅ Include all project components
- ✅ ISO date format
- ✅ File download functionality

### Requirement 5: JSON Import
- ✅ Validate JSON structure
- ✅ Create project from JSON
- ✅ Date adjustment on import
- ✅ Error handling for invalid JSON

### Requirement 6: AI Project Generation
- ✅ Process user prompts
- ✅ Generate structured projects
- ✅ Preview before import
- ✅ Error handling for API failures

### Requirement 7: Complex Prompt Handling
- ✅ Basic to complex prompts
- ✅ Hierarchical task structure
- ✅ Realistic duration assignment

### Requirement 8: Date Format Consistency
- ✅ Consistent date display
- ✅ Format conversion
- ✅ ISO format for storage

## Continuous Integration

These tests are designed to run in CI/CD environments:

```yaml
# Example GitHub Actions workflow
- name: Run E2E Tests
  run: |
    npm install
    npm run test:e2e-all
    
- name: Upload Test Reports
  uses: actions/upload-artifact@v3
  with:
    name: e2e-test-reports
    path: test-reports/
```

## Troubleshooting

### Common Issues

1. **OpenAI API Key Required**
   - Some tests require a valid OpenAI API key
   - Set `OPENAI_API_KEY` environment variable for full testing

2. **Memory Issues with Large Tests**
   - Increase Node.js memory limit: `node --max-old-space-size=4096`
   - Run tests individually if system resources are limited

3. **Timeout Issues**
   - Performance tests may timeout on slower systems
   - Adjust timeout values in test configuration

4. **File System Permissions**
   - Ensure write permissions for test report generation
   - Check that `test-reports/` directory can be created

### Debug Mode

Run tests with debug output:

```bash
DEBUG=1 npm run test:e2e-all
```

This will provide additional logging and performance metrics.

## Contributing

When adding new tests:

1. Follow the existing test structure and naming conventions
2. Include performance benchmarks for new operations
3. Add comprehensive error handling tests
4. Update this documentation with new test categories
5. Ensure tests are deterministic and can run in any order

## Test Data

Test data is generated programmatically to ensure consistency and avoid dependencies on external files. Large datasets are created using utility functions to simulate real-world scenarios while maintaining test performance.