'use strict';
const ScaffoldHandler = require('./lib/scaffoldHandler');

function TransomScaffold() {
	this.initialize = function (server, options) {
        const apiScaffold = server.registry.get('transom-options.api_definition.scaffold', {});
		const handlerOpts = Object.assign({}, apiScaffold, options);
		const scaffoldHandler = new ScaffoldHandler(server, handlerOpts);
		server.registry.set(options.registryKey || 'transomScaffold', scaffoldHandler);
	}
}

module.exports = new TransomScaffold();