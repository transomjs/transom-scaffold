// Compiled by `npm run typecheck` only: checks the published types the way a consumer uses them.
import express from "express";
import transomScaffold = require("../../dist");
import ScaffoldHandler = require("../../lib/scaffoldHandler");

const definition: transomScaffold.Definition = {
  staticRoutes: [{ path: "/html", folder: "static-assets/html" }],
  redirectRoutes: { path: "/old", target: { pathname: "/new", permanent: true } },
  Home: { path: "/", data: { title: "Welcome" } },
};

const app = express();
const store = new Map<string, unknown>([["transom-config.definition.scaffold", definition]]);
const server: transomScaffold.PluginServer = {
  registry: {
    get: (key: string, defaultValue?: object) => store.get(key) ?? defaultValue,
    set: (key, value) => void store.set(key, value),
  },
  get: (path, ...handlers) => app.get(path, ...handlers),
  use: (path, ...handlers) => app.use(path, ...handlers),
};
const ready: Promise<void> = transomScaffold.initialize(server, { templateHandler: "transomTemplate" });

const handler: transomScaffold.Handler = ScaffoldHandler(server);
handler.addRedirectRoute(server, { path: "/x", target: "https://example.com" });

export { ready };
