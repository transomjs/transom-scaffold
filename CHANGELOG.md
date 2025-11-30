# @transomjs/transom-scaffold change log

## 2.0.0
- **BREAKING CHANGE**: Updated for Transom Core v5+ Express compatibility
- Replaced Restify dependencies with Express static middleware
- Updated static asset serving to use Express middleware patterns
- Enhanced redirect handling for Express-style responses
- Improved template route handling for Express compatibility
- Maintained backward compatibility with existing test suites and API
- Static routes now use `server.use()` when available (Express) or fall back to `server.get()` for compatibility

## 1.2.3
- Added a default `folder` ("/", the project root) for serving static assets

## earlier
- Working as documented and not previously change-logged.