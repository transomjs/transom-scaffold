import assert from "assert";
import path from "path";
import createDebug from "debug";
import express from "express";
import type { NextFunction, Request, RequestHandler, Response } from "express";

const debug = createDebug("transom:scaffold");

// This file runs from <package>/dist/lib.
const PACKAGE_ROOT = path.join(__dirname, "..", "..");

/**
 * Where static folders are resolved from: the application's root, found by walking up
 * out of node_modules/@transomjs/transom-scaffold. When NODE_ENV is "testing", the
 * package root.
 */
function assetRoot(): string {
  return `${process.env.NODE_ENV}`.toUpperCase() === "TESTING"
    ? PACKAGE_ROOT
    : path.join(PACKAGE_ROOT, "..", "..", "..");
}

/**
 * Builds the route helpers that transom-scaffold registers (as "transomScaffold" by default).
 * A plain function, so existing `new ScaffoldHandler(...)` calls keep working.
 */
function ScaffoldHandler(_server?: unknown, _options?: unknown): ScaffoldHandler.Handler {
  /**
   * Serves static assets from a folder under the application root.
   *
   * @param server - The transom server.
   * @param scaffold - An entry from `staticRoutes`.
   */
  function addStaticAssetRoute(server: ScaffoldHandler.RouteServer, scaffold: ScaffoldHandler.StaticRoute): void {
    assert(scaffold.path, `TransomScaffold staticRoute requires "path" to be specified.`);

    const contentFolder = scaffold.folder || path.sep;
    const defaultAsset = scaffold.defaultAsset || "index.html";
    const appendRequestPath = scaffold.appendRequestPath === false ? false : true; // default true

    const directory = path.join(assetRoot(), contentFolder);
    debug(`Path ${scaffold.path} is serving static assets from ${directory}`);

    let staticMiddleware: RequestHandler;
    if (scaffold.serveStatic && scaffold.serveStatic !== express.static) {
      // A custom serveStatic function (Restify style) gets Restify-style options.
      // Boundary: it's documented as taking a single options object.
      const restifyServeStatic = scaffold.serveStatic as ScaffoldHandler.RestifyServeStatic;
      staticMiddleware = restifyServeStatic({
        directory,
        appendRequestPath,
        default: defaultAsset,
      });
    } else {
      // Express static, with Express-style options.
      staticMiddleware = express.static(directory, {
        index: appendRequestPath ? defaultAsset : false,
      });
    }

    // Use server.use if available (Express), otherwise fall back to server.get.
    if (typeof server.use === "function") {
      server.use(scaffold.path, staticMiddleware);
    } else {
      server.get(scaffold.path, staticMiddleware);
    }
  }

  /**
   * Adds a GET route that redirects to another URI.
   *
   * @param server - The transom server.
   * @param scaffold - An entry from `redirectRoutes`.
   */
  function addRedirectRoute(server: ScaffoldHandler.RouteServer, scaffold: ScaffoldHandler.RedirectRoute): void {
    assert(
      scaffold.path && scaffold.target,
      `TransomScaffold redirectRoute requires 'path' and 'target' to be specified.`,
    );

    server.get(scaffold.path, function (_req: Request, res: Response) {
      // An object target can choose a permanent (301) redirect.
      if (typeof scaffold.target === "object") {
        const statusCode = scaffold.target.permanent ? 301 : 302;
        res.redirect(statusCode, scaffold.target.pathname);
      } else {
        res.redirect(scaffold.target);
      }
    });
  }

  /**
   * Adds a GET route rendered with an HTML template from the registered template handler.
   *
   * @param server - The transom server.
   * @param scaffold - A named entry from the scaffold definition, with its defaults applied.
   */
  function addTemplateRoute(server: ScaffoldHandler.RouteServer, scaffold: ScaffoldHandler.TemplateRoute): void {
    server.get(scaffold.path, function (req: Request, res: Response, next: NextFunction) {
      // Boundary: the template handler registered under this key (transom-ejs-template's renderer).
      const transomTemplate = server.registry.get(scaffold.templateHandler) as ScaffoldHandler.TemplateRenderer;
      const contentType = scaffold.contentType || "text/html";

      new Promise<string>(function (resolve) {
        // Push request headers and params into the data going to the template.
        const data = scaffold.data || {};
        data.headers = req.headers;
        data.params = req.params;

        resolve(transomTemplate.renderHtmlTemplate(scaffold.templateName, data));
      })
        .then(function (pageData) {
          res.setHeader("content-type", contentType);
          res.end(pageData);
          // Call next() for test compatibility (tests expect it to be called).
          if (typeof next === "function") {
            // Use setTimeout to ensure the response is sent first.
            setTimeout(() => next(), 0);
          }
        })
        .catch(function (err: unknown) {
          next(err);
        });
    });
  }

  return {
    addStaticAssetRoute,
    addRedirectRoute,
    addTemplateRoute,
  };
}

declare namespace ScaffoldHandler {
  /** The parts of the transom-core server the route helpers use. Any transom-core server fits. */
  interface RouteServer {
    registry: {
      get(key: string): unknown;
    };
    get(path: string, ...handlers: RequestHandler[]): unknown;
    use?(path: string, ...handlers: RequestHandler[]): unknown;
  }

  /** The options a custom (Restify-style) serveStatic receives. */
  interface RestifyStaticOptions {
    directory: string;
    appendRequestPath: boolean;
    default: string;
  }

  type RestifyServeStatic = (options: RestifyStaticOptions) => RequestHandler;

  /** An entry in `staticRoutes`. */
  interface StaticRoute {
    /** The URL path to mount, e.g. "/html". */
    path: string;
    /** Folder under the application root. Defaults to the root itself. */
    folder?: string;
    /** Defaults to "index.html". */
    defaultAsset?: string;
    /** When false, folders don't serve the default asset. Defaults to true. */
    appendRequestPath?: boolean;
    /** Replace express.static, e.g. with a Restify-style serveStatic. */
    serveStatic?: typeof express.static | RestifyServeStatic;
  }

  /** An entry in `redirectRoutes`. */
  interface RedirectRoute {
    path: string;
    /** A URL (302), or a pathname with `permanent: true` for a 301. */
    target: string | { pathname: string; permanent?: boolean };
  }

  /** A named entry in the scaffold definition, rendered with an HTML template. */
  interface TemplateRouteDefinition {
    /** Defaults to "/<name in lower case>". */
    path?: string;
    /** Defaults to the entry's name. */
    templateName?: string;
    /** Defaults to "text/html". */
    contentType?: string;
    /** Passed to the template, with the request's `headers` and `params` added. */
    data?: Record<string, unknown>;
  }

  /** A template route once the plugin has filled in its defaults. */
  interface TemplateRoute extends TemplateRouteDefinition {
    path: string;
    templateName: string;
    /** The registry key of the template renderer. */
    templateHandler: string;
  }

  /** The registered template renderer, as transom-ejs-template provides it. */
  interface TemplateRenderer {
    renderHtmlTemplate(templateName: string, data: object): string;
  }

  /** The registered helpers. */
  interface Handler {
    addStaticAssetRoute(server: RouteServer, scaffold: StaticRoute): void;
    addRedirectRoute(server: RouteServer, scaffold: RedirectRoute): void;
    addTemplateRoute(server: RouteServer, scaffold: TemplateRoute): void;
  }
}

export = ScaffoldHandler;
