'use strict';
const ScaffoldHandler = require('./lib/scaffoldHandler');

function TransomScaffold() {
	this.initialize = function (server, options) {
		server.registry.set(options.registryKey || 'transomScaffold', new ScaffoldHandler(server, options));
	}
}

module.exports = new TransomScaffold();