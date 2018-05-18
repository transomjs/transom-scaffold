'use strict';
const debug = require('debug')('transom:scaffold');
const restify = require('restify');
const path = require('path');
const assert = require('assert');

module.exports = function ScaffoldHandler(server) {

    /**
     * Add a GET route to the server to handle static assets.
     * 
     * @param {*} server  - Restify server instance
     * @param {*} scaffold - Object from the staticRoutes array.
     */
    function addStaticAssetRoute(server, scaffold) {
        assert(scaffold.path && scaffold.folder, `TransomScaffold staticRoute requires "path" and "folder" to be specified.`);

        const serveStatic = scaffold.serveStatic || restify.plugins.serveStatic;
        const defaultAsset = scaffold.defaultAsset || 'index.html';
        const appendRequestPath = scaffold.appendRequestPath || true;

        // When we are running tests, the path to our assets will be different. 
        // We create the path using NODE_ENV which should be set to TESTING.
        let directory = path.join(__dirname, '..', '..', '..', '..', scaffold.folder);
        if ((process.env.NODE_ENV || '').toUpperCase() === 'TESTING') {
            directory = path.join(__dirname, "..", scaffold.folder);
        }
        debug(`Path ${scaffold.path} is serving static assets from ${directory}`);

        server.get(scaffold.path, serveStatic({
            directory,
            appendRequestPath,
            default: defaultAsset
        }));
    }

    /**
     * Add a GET route that redirects to another URI.
     * 
     * @param {*} server - Restify server instance 
     * @param {*} scaffold  - Object from the redirectRoutes array.
     */
    function addRedirectRoute(server, scaffold) {
        assert(scaffold.path && scaffold.target, `TransomScaffold redirectRoute requires 'path' and 'target' to be specified.`);

        server.get(scaffold.path, function (req, res, next) {
            res.redirect(scaffold.target, next);
        });
    }

    /**
     * Add a GET route that is handled with a template.
     * 
     * @param {*} server - Restify server instance
     * @param {String} key 
     * @param {*} scaffold 
     */
    function addTemplateRoute(server, scaffold) {
        server.get(scaffold.path, function (req, res, next) {
            const transomTemplate = server.registry.get(scaffold.templateHandler);
            const contentType = scaffold.contentType || 'text/html';

            const p = new Promise(function (resolve, reject) {
                // const templateName = scaffold.templateName || key;
                // Push request headers and params in the the data going to the template.
                const data = scaffold.data || {};
                data.headers = req.headers;
                data.params = req.params;

                resolve(transomTemplate.renderHtmlTemplate(scaffold.templateName, data));
            }).then(function (pageData) {
                res.setHeader('content-type', contentType);
                res.end(pageData);
                next(false); // false stops the chain.
            }).catch(function (err) {
                next(err);
            });
        });
    }

    return {
        addStaticAssetRoute,
        addRedirectRoute,
        addTemplateRoute
    };
};