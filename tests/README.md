# Unit Tests for Hono App

## Overview

This test suite provides comprehensive coverage for the Hono application, focusing on the recently added 404 handler functionality.

## Test Structure

### Main Routes Tests (`GET /`)
- Status code verification
- Content type validation
- HTML content structure
- Accessibility features
- Material Design implementation
- JavaScript functionality inclusion

### 404 Handler Tests
1. **Basic Functionality**
   - Status code verification (404)
   - Content type validation
   - Response consistency

2. **Content Validation**
   - Japanese error messages
   - Navigation links
   - Page structure
   - Semantic HTML

3. **Styling and Design**
   - Material Design color system
   - Responsive design
   - Typography
   - Visual consistency with main page

4. **Accessibility**
   - ARIA roles
   - Semantic HTML
   - Keyboard navigation support
   - Focus management

5. **Edge Cases**
   - Special characters in URLs
   - Unicode paths
   - Long paths
   - Query parameters and fragments
   - Various HTTP methods

6. **Integration**
   - Interaction with valid routes
   - Consistency across the application
   - Branding consistency

## Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Coverage

The test suite includes over 100 test cases covering:
- ✅ Happy path scenarios
- ✅ Edge cases (special characters, long URLs, etc.)
- ✅ Error conditions
- ✅ Accessibility features
- ✅ Cross-browser compatibility concerns
- ✅ Performance optimizations (preconnect, etc.)
- ✅ HTTP method variations
- ✅ Response consistency

## Adding New Tests

When adding new routes or features:
1. Add tests for the happy path
2. Add tests for error conditions
3. Test accessibility features
4. Test edge cases
5. Verify integration with existing features

## Dependencies

- **Vitest**: Modern, fast test runner with TypeScript support
- **@vitest/coverage-v8**: Code coverage reporting