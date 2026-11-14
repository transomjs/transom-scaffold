import createDebug from "debug";
import ScaffoldHandler = require("./lib/scaffoldHandler");

const debug = createDebug("transom:scaffold");

/** The parts of the transom-core server this plugin uses. Any transom-core server fits. */
interface ScaffoldPluginServer extends ScaffoldHandler.RouteServer {
  registry: ScaffoldHandler.RouteServer["registry"] & {
    get(key: string, defaultValue: object): unknown;
    set(key: string, value: unknown): void;
  };
}

/** Plugin options, from transom.configure(). */
interface ScaffoldOptions {
  /** The registry key for the route helpers. Defaults to "transomScaffold". */
  registryKey?: string;
  /** The registry key of the template renderer. Defaults to "transomTemplate". */
  templateHandler?: string;
  /** Set by the plugin: a copy of the API definition's scaffold section. */
  scaffold?: ScaffoldDefinition;
}

/**
 * The API definition's `definition.scaffold` section. `staticRoutes` and `redirectRoutes`
 * take one route or a list; every other entry is a template route named by its key.
 */
interface ScaffoldDefinition {
  staticRoutes?: ScaffoldHandler.StaticRoute | ScaffoldHandler.StaticRoute[];
  redirectRoutes?: ScaffoldHandler.RedirectRoute | ScaffoldHandler.RedirectRoute[];
  [templateRoute: string]:
    | ScaffoldHandler.TemplateRouteDefinition
    | ScaffoldHandler.StaticRoute
    | ScaffoldHandler.StaticRoute[]
    | ScaffoldHandler.RedirectRoute
    | ScaffoldHandler.RedirectRoute[]
    | undefined;
}

function asList<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value];
}

/**
 * Adds static asset, redirect and template routes from the API definition's
 * `definition.scaffold` section, and registers the route helpers.
 */
class TransomScaffold {
  initialize = (server: ScaffoldPluginServer, options: ScaffoldOptions): Promise<void> => {
    return new Promise<void>(function (resolve) {
      // Boundary: the API definition's scaffold section.
      const scaffoldDefn = server.registry.get("transom-config.definition.scaffold", {}) as ScaffoldDefinition;
      const scaffolds: ScaffoldDefinition = Object.assign({}, scaffoldDefn);
      options.scaffold = scaffolds;

      const scaffoldHandler = ScaffoldHandler(server);
      server.registry.set(options.registryKey || "transomScaffold", scaffoldHandler);

      // Add simple get routes to fetch scaffolded content.
      Object.keys(scaffolds).map(function (key) {
        if (key === "staticRoutes") {
          const staticRoutes = scaffolds.staticRoutes;
          if (staticRoutes === undefined) {
            return;
          }
          asList(staticRoutes).map(function (route) {
            debug(`Setting up '${route.path}' as a static asset route`);
            scaffoldHandler.addStaticAssetRoute(server, route);
          });
        } else if (key === "redirectRoutes") {
          const redirectRoutes = scaffolds.redirectRoutes;
          if (redirectRoutes === undefined) {
            return;
          }
          asList(redirectRoutes).map(function (route) {
            debug(`Setting up '${route.path}' as a redirect route`);
            scaffoldHandler.addRedirectRoute(server, route);
          });
        } else {
          // Boundary: every other key is a template route. Its defaults are filled in
          // place, on the definition's own object, as before.
          const scaffold = scaffolds[key] as ScaffoldHandler.TemplateRoute;
          scaffold.path = scaffold.path || `/${key.toLowerCase()}`;
          scaffold.templateName = scaffold.templateName || key;
          scaffold.templateHandler = options.templateHandler || "transomTemplate";
          debug(`Setting up '${scaffold.path}' as a template route to ${scaffold.templateName}`);
          scaffoldHandler.addTemplateRoute(server, scaffold);
        }
      });
      resolve();
    });
  };
}

/** The plugin instance, as `require("@transomjs/transom-scaffold")` has always returned. */
const transomScaffold = new TransomScaffold();

declare namespace transomScaffold {
  type Options = ScaffoldOptions;
  type Definition = ScaffoldDefinition;
  type StaticRoute = ScaffoldHandler.StaticRoute;
  type RedirectRoute = ScaffoldHandler.RedirectRoute;
  type TemplateRoute = ScaffoldHandler.TemplateRouteDefinition;
  type RestifyServeStatic = ScaffoldHandler.RestifyServeStatic;
  type Handler = ScaffoldHandler.Handler;
  type PluginServer = ScaffoldPluginServer;
}

export = transomScaffold;
