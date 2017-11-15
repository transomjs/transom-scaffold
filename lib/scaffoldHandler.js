'use strict';
const restify = require('restify');
const path = require('path');

module.exports = function ScaffoldHandler(server, options) {

    const templateHandler = options.templateHandler || 'transomTemplate';

    function addScaffoldRoute(server, scaffold) {

        if (scaffold.static) {
            // Static assets could use a regex to match URI paths:
            // like the following: /(js|css|fonts|images)\/?.*/
            const assetPath = scaffold.assetPath || /assets\/(js|css|fonts|images)\/?.*/;
            server.get(scaffold.path, restify.serveStatic({
                'directory': path.join(__dirname, '..', '..', '..', assetPath),
                'appendRequestpath': true,
                'default': scaffold.defaultAsset || 'index.html'
            }));
        } else {
            const templateName = scaffold.templateName || key;
            const contentType = scaffold.contentType || 'text/html';
            // Push request headers and params in the the data going to the template.
            const data = scaffold.data || {};
            data.headers = req.headers;
            data.params = req.params;
    
            server.get(scaffold.path, function (req, res, next) {
                const transomTemplate = server.registry.get(templateHandler);
                const p = new Promise(function (resolve, reject) {
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
    }

    // Add simple get routes to fetch templated content.
    Object.keys(options.scaffold).map(function (key) {
        const scaffold = options.scaffold[key];
        scaffold.path = scaffold.path || `/${key.toLowerCase()}`;
        addScaffoldRoute(server, scaffold);
    });

    return {
        addScaffoldRoute
    };
};