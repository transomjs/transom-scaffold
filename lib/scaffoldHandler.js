'use strict';
const restify = require('restify');
const path = require('path');

module.exports = function ScaffoldHandler(server, options) {

    const templateHandler = options.templateHandler || 'transomTemplate';

    function addStaticAssetRoute(server, key, scaffold) {
        const assetPath = scaffold.assetPath || key.toLowerCase();
        const uriPath = scaffold.path || /(js|css|fonts|images)\/?.*/;
        const directory = path.join(__dirname, '..', '..', '..', '..', assetPath);

        server.get(uriPath, restify.serveStatic({
            directory,
            appendRequestpath: true,
            default: scaffold.defaultAsset || 'index.html'
        }));
    }

    function addTemplateRoute(server, key, scaffold) {
        const uriPath = scaffold.path || `/${key.toLowerCase()}`;

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
        } else {
            addTemplateRoute(server, key, scaffold);
        }
    });

    return {
        addStaticAssetRoute,
        addTemplateRoute
    };
};