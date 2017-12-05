'use strict';
const restify = require('restify');
const path = require('path');

module.exports = function ScaffoldHandler(server, options) {

    const environment = (process.env.NODE_ENV || 'DEVELOPMENT').toUpperCase();
    
    const templateHandler = options.templateHandler || 'transomTemplate';
    options.scaffold = options.scaffold || {};
    
    /**
     * Add a GET route to the server to handle static assets.
     * 
     * @param {*} server  - Restify server instance
     * @param {String} key 
     * @param {*} scaffold 
     */
    function addStaticAssetRoute(server, key, scaffold) {
        const assetPath = scaffold.assetPath || key.toLowerCase();
        const uriPath = scaffold.path || /(js|css|fonts|images)\/?.*/;
        const serveStatic = scaffold.serveStatic || restify.plugins.serveStatic;

        const directory = (environment === 'TESTING' ? path.join(__dirname, "..", key) : path.join(__dirname, '..', '..', '..', '..', key));
        const defaultAsset = scaffold.defaultAsset || 'index.html';

        server.get(uriPath, serveStatic({
            directory,
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
    function addRedirectRoute(server, key, scaffold) {
        const uriPath = scaffold.path || `/${key.toLowerCase()}`;

        server.get(uriPath, function (req, res, next) {
            res.redirect(scaffold.redirect, next);
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

    // Add simple get routes to fetch templated content.
    Object.keys(options.scaffold).map(function (key) {
        const scaffold = options.scaffold[key];
        if (scaffold.static) {
            addStaticAssetRoute(server, key, scaffold);
        } else if (scaffold.redirect) {
            addRedirectRoute(server, key, scaffold);
        } else {
            addTemplateRoute(server, key, scaffold);
        }
    });

    return {
        addStaticAssetRoute,
        addRedirectRoute,
        addTemplateRoute
    };
};