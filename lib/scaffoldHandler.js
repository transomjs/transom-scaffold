'use strict';

module.exports = function ScaffoldHandler(server, options) {

    const templateHandler = options.templateHandler || 'transomTemplate';

    function addScaffoldRoute(server, scaffold) {

        server.get(scaffold.path, function (req, res, next) {
            const transomTemplate = server.registry.get(templateHandler);
            const p = new Promise(function (resolve, reject) {
                resolve(transomTemplate.renderHtmlTemplate(scaffold.templateName, scaffold.data));
            }).then(function (data) {
                res.setHeader('content-type', scaffold.contentType);
                res.end(data);
                next(false); // false stops the chain.
            }).catch(function (err) {
                next(err);
            });
        });
    }

    // Add simple get routes to fetch templated content.
    Object.keys(options.scaffold).map(function (key) {
        const scaffold = options.scaffold[key];
        scaffold.templateName = scaffold.templateName || key;
        scaffold.path = scaffold.path || `/${key.toLowerCase()}`;
        scaffold.contentType = scaffold.contentType || 'text/html';
        scaffold.data = scaffold.data || {};
        // Push the request headers in the the data going to the template.
        scaffold.data.headers = req.headers;

        addScaffoldRoute(server, scaffold);
    });

    return {
        addScaffoldRoute
    };
};