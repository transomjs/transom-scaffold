# @transomjs/transom-scaffold change log

## 6.0.0
- Dev tools: mocha 12, chai 6, c8 12, sinon 22, cross-env 10, open-cli 9; tests run against
  transom-core 7. The unused shelljs is removed. Express (and `@types/express`) stay on 4 to
  match transom-core, which provides the Express app.
- **Requires Node.js 22 or newer** (`engines.node` is `>=22`). The compiled code targets ES2023,
  and CI runs on Node 22 and 24.
- Rewritten in TypeScript, with type definitions. The compiled code is in `dist/`;
  `require("@transomjs/transom-scaffold")` and `.../lib/scaffoldHandler` return the same
  things as before, and static folders are still resolved from the application's root.
- Types: `Definition` (the `definition.scaffold` section), `StaticRoute`, `RedirectRoute`,
  `TemplateRoute`, `Options` and `Handler`. `@types/express` is now a dependency, since the
  types build on it.

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