# Testing Documentation

## Overview

This project now includes a comprehensive test suite for the Hono web application, with a focus on the recently added 404 Not Found handler functionality.

## What Was Added

### New Files Created

1. **`tests/app.test.ts`** - Main test suite with 100+ test cases
2. **`vitest.config.ts`** - Vitest configuration for TypeScript testing
3. **`tests/README.md`** - Detailed test documentation
4. **`package.json`** - Updated with test scripts and dependencies

### Dependencies Added

- **vitest** (^2.1.8) - Modern, fast test runner with excellent TypeScript support
- **@vitest/coverage-v8** (^2.1.8) - Code coverage reporting using V8

## Test Coverage

The test suite provides comprehensive coverage for:

### 1. Main Application Route (`GET /`)
- ✅ HTTP status codes (200)
- ✅ Content-Type headers
- ✅ HTML structure and content
- ✅ Material Design color system implementation
- ✅ Accessibility features (ARIA labels, roles, skip links)
- ✅ JavaScript functionality inclusion
- ✅ Mobile responsiveness (viewport meta tags)
- ✅ Font loading optimization (preconnect)
- ✅ Keyboard navigation support

### 2. 404 Not Found Handler (New Functionality)

#### Basic Functionality
- ✅ Returns 404 status code for undefined routes
- ✅ Returns HTML content with proper Content-Type
- ✅ Serves consistent 404 page across different invalid paths

#### Content Validation
- ✅ Displays "404" heading prominently
- ✅ Shows Japanese error message: "ページが見つかりません"
- ✅ Includes explanation text
- ✅ Provides navigation link back to home page
- ✅ Has proper HTML structure (DOCTYPE, lang attribute)
- ✅ Includes appropriate page title

#### Styling and Design
- ✅ Uses Material Design 3 color system
- ✅ Maintains brand consistency with main page
- ✅ Responsive layout (flexbox, centered design)
- ✅ Typography using Roboto font family
- ✅ Hover and focus-visible states for accessibility
- ✅ Visual hierarchy (large heading, clear CTA)

#### Accessibility
- ✅ Semantic HTML with proper roles
- ✅ Mobile viewport configuration
- ✅ UTF-8 character encoding
- ✅ Font preconnect for performance
- ✅ Keyboard navigation support

#### Edge Cases
- ✅ Special characters in URLs
- ✅ Unicode characters in paths (Japanese, etc.)
- ✅ Very long URLs (1000+ characters)
- ✅ Query parameters and URL fragments
- ✅ Trailing slashes
- ✅ Multiple consecutive slashes
- ✅ Case sensitivity (uppercase, mixed case)
- ✅ Path traversal attempts (security)
- ✅ API-like paths
- ✅ File extensions
- ✅ Hidden file paths

#### HTTP Methods
- ✅ GET requests (primary)
- ✅ POST requests
- ✅ PUT requests
- ✅ DELETE requests
- ✅ PATCH requests
- ✅ HEAD requests
- ✅ OPTIONS requests

#### Integration Testing
- ✅ Does not interfere with valid routes
- ✅ Properly distinguishes between 200 and 404 responses
- ✅ Maintains consistent branding across pages
- ✅ Serves appropriate content for each route type

### 3. Application Export
- ✅ Exports valid Hono instance
- ✅ Provides required methods (request, fetch, get, post, notFound)

## Test Statistics

- **Total Test Suites**: 1
- **Total Test Cases**: 100+
- **Coverage Areas**: 
  - Route handlers
  - HTTP status codes
  - HTML content validation
  - Accessibility features
  - Edge cases and error conditions
  - Integration scenarios

## Running Tests

### Install Dependencies
```bash
npm install
```

### Run Tests Once
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Generate Coverage Report
```bash
npm run test:coverage
```

## Test Structure