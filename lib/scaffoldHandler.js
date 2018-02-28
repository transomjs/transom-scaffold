'use strict';
const debug = require('debug')('transom:scaffold');
const restify = require('restify');
const path = require('path');
const assert = require('assert');

module.exports = function ScaffoldHandler(server, options) {

    const templateHandler = options.templateHandler || 'transomTemplate';
    options.scaffold = options.scaffold || {};

    /**
     * Add a GET route to the server to handle static assets.
     * 
     * @param {*} server  - Restify server instance
     * @param {String} key 
     * @param {*} scaffold 
     */
    function addStaticAssetRouteOld(server, key, scaffold) {
        const assetPath = scaffold.assetPath || key.toLowerCase();
        const uriPath = scaffold.path || /(js|css|fonts|images)\/?.*/;
        const serveStatic = scaffold.serveStatic || restify.plugins.serveStatic;
        const defaultAsset = scaffold.defaultAsset || 'index.html';

        // When we are running tests, the path to our assets will be different. 
        // We create the path using NODE_ENV which should be set to TESTING.
        let assetDirectory = path.join(__dirname, '..', '..', '..', '..', assetPath);
        if (process.env.NODE_ENV === 'TESTING') {
            assetDirectory = path.join(__dirname, "..", assetPath);
        }

        debug(`Adding ${uriPath} using deprecated method`);
        server.get(uriPath, serveStatic({
            directory: assetDirectory,
            appendRequestPath: true,
            default: defaultAsset
        }));
    }

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

        // When we are running tests, the path to our assets will be different. 
        // We create the path using NODE_ENV which should be set to TESTING.
        console.log("process.env.NODE_ENV", process.env.NODE_ENV);
        let assetDirectory = path.join(__dirname, '..', '..', '..', '..', scaffold.folder);
        if ((process.env.NODE_ENV || '').toUpperCase() === 'TESTING') {
            assetDirectory = path.join(__dirname, "..", scaffold.folder);
        }

        server.get(scaffold.path, serveStatic({
            directory: assetDirectory,
            appendRequestPath: true,
            default: defaultAsset
        }));
    }

    /**
     * Add a GET route that redirects to another URI.
     * 
     * @param {*} server - Restify server instance 
     * @param {String} key 
     * @param {*} scaffold 
     */
    function addRedirectRouteOld(server, key, scaffold) {
        const uriPath = scaffold.path || `/${key.toLowerCase()}`;

        debug(`Adding ${uriPath} using deprecated method`);
        server.get(uriPath, function (req, res, next) {
            res.redirect(scaffold.redirect, next);
        });
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
    function addTemplateRoute(server, key, scaffold) {
        const uriPath = scaffold.path || `/${key.toLowerCase()}`;

        // Replace any doubled-up slashes with a single.
        // uriPath = uriPath.replace(/\/+/g, '/');

        server.get(uriPath, function (req, res, next) {
            const transomTemplate = server.registry.get(templateHandler);
            const contentType = scaffold.contentType || 'text/html';

            const p = new Promise(function (resolve, reject) {
                const templateName = scaffold.templateName || key;
                // Push request headers and params in the the data going to the template.
                const data = scaffold.data || {};
                data.headers = req.headers;
                data.params = req.params;

                resolve(transomTemplate.renderHtmlTemplate(templateName, data));
            }).then(function (pageData) {
                res.setHeader('content-type', contentType);
                res.end(pageData);
                next(false); // false stops the chain.
            }).catch(function (err) {
                next(err);
            });
        });
    }

    try {
        // Add simple get routes to fetch templated content.
        Object.keys(options.scaffold).map(function (key) {
            const scaffold = options.scaffold[key];

            debug(`Setting up '${key}' route`);

            if (key === 'staticRoutes') {
                const staticRoutes = Array.isArray(scaffold) ? scaffold : [scaffold];
                staticRoutes.map(function (route) {
                    // console.log("Static", route);
                    addStaticAssetRoute(server, route);
                });
            } else if (key === 'redirectRoutes') {
                const redirectRoutes = Array.isArray(scaffold) ? scaffold : [scaffold];
                redirectRoutes.map(function (route) {
                    // console.log("Redirect", route);
                    addRedirectRoute(server, route);
                });
            } else {
                // TODO: remove the old static & redirect handlers at next milestone release.
                if (scaffold.static) {
                    console.info(`Warning: the scaffold "static" attribute is deprecated. "${key}" should use "staticRoutes" instead.`);
                    addStaticAssetRouteOld(server, key, scaffold);
                    return;
                }
                if (scaffold.redirect) {
                    console.info(`Warning: the scaffold "redirect" attribute is deprecated. "${key}" should use "redirectRoutes" instead.`);
                    addRedirectRouteOld(server, key, scaffold);
                    return;
                }
                addTemplateRoute(server, key, scaffold);
            }
        });
    } catch (err) {
        console.log(err);
    }    
    return {
        addStaticAssetRoute,
        addRedirectRoute,
        addTemplateRoute
    };
};