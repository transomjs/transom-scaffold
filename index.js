'use strict';
const debug = require('debug')('transom:scaffold');
const ScaffoldHandler = require('./lib/scaffoldHandler');

function TransomScaffold() {
	this.initialize = function (server, options) {
		return new Promise(function(resolve, reject){
			const scaffoldDefn = server.registry.get('transom-config.definition.scaffold', {});
			options.scaffold = Object.assign({}, scaffoldDefn);
			
			const scaffoldHandler = new ScaffoldHandler(server);
			server.registry.set(options.registryKey || 'transomScaffold', scaffoldHandler);
	
			// Add simple get routes to fetch scaffolded content.
			Object.keys(options.scaffold).map(function (key) {
				const scaffold = options.scaffold[key];

				if (key === 'staticRoutes') {
					const staticRoutes = Array.isArray(scaffold) ? scaffold : [scaffold];
					staticRoutes.map(function (route) {
						debug(`Setting up '${route.path}' as a static asset route`);
						scaffoldHandler.addStaticAssetRoute(server, route);
					});
				} else if (key === 'redirectRoutes') {
					const redirectRoutes = Array.isArray(scaffold) ? scaffold : [scaffold];
					redirectRoutes.map(function (route) {
						debug(`Setting up '${route.path}' as a redirect route`);
						scaffoldHandler.addRedirectRoute(server, route);
					});
				} else {
					scaffold.path = scaffold.path || `/${key.toLowerCase()}`;
					scaffold.templateName = scaffold.templateName || key;
					scaffold.templateHandler = options.templateHandler || 'transomTemplate';
					debug(`Setting up '${scaffold.path}' as a template route to ${scaffold.templateName}`);
					scaffoldHandler.addTemplateRoute(server, scaffold);
				}
			});
			resolve();
		});
	}
}

module.exports = new TransomScaffold();