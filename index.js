'use strict';
const ScaffoldHandler = require('./lib/scaffoldHandler');

function TransomScaffold() {
	this.initialize = function (server, options) {
		return new Promise(function(resolve, reject){
			const apiScaffold = server.registry.get('transom-config.definition.scaffold', {});
			options.scaffold = Object.assign({}, apiScaffold, options.scaffold);
			
			const scaffoldHandler = new ScaffoldHandler(server, options);
			server.registry.set(options.registryKey || 'transomScaffold', scaffoldHandler);
			resolve();
		});
	}
}

module.exports = new TransomScaffold();