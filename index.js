'use strict';
const ScaffoldHandler = require('./lib/scaffoldHandler');

function TransomScaffold() {
	this.initialize = function (server, options) {
        const apiScaffold = server.registry.get('transom-options.api_definition.scaffold', {});
		options.scaffold = Object.assign({}, apiScaffold, options.scaffold);
		
		const scaffoldHandler = new ScaffoldHandler(server, options);
		server.registry.set(options.registryKey || 'transomScaffold', scaffoldHandler);
	}
}

module.exports = new TransomScaffold();