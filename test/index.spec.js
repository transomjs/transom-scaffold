"use strict";
const expect = require('chai').expect;
const sinon = require('sinon');
const express = require('express');
const PocketRegistry = require('pocket-registry');
const transomScaffold = require('../');
const ScaffoldHandler = require('../lib/scaffoldHandler');

// Builds a transom-like server over a real Express app and starts it on a free port.
async function startServer(scaffold, options) {
    const app = express();
    const registry = new PocketRegistry();
    if (scaffold) {
        registry.set('transom-config.definition.scaffold', scaffold);
    }
    registry.set('transomTemplate', {
        renderHtmlTemplate(name, data) {
            if (name === 'Broken') {
                throw new Error('template failed');
            }
            return [name, data.who || '', data.params ? 'params' : '', data.headers ? 'headers' : ''].join(':');
        }
    });
    const server = {
        registry,
        get: app.get.bind(app),
        use: app.use.bind(app)
    };
    await transomScaffold.initialize(server, options || {});
    // Errors from routes surface as 500 with the message.
    app.use(function (err, req, res, next) {
        if (res.headersSent) {
            return next(err);
        }
        res.status(500).send(err.message);
    });
    const listener = await new Promise((resolve) => {
        const l = app.listen(0, '127.0.0.1', () => resolve(l));
    });
    const base = 'http://127.0.0.1:' + listener.address().port;
    return {
        registry,
        fetch: (path) => fetch(base + path, { redirect: 'manual' }),
        close: () => new Promise((resolve) => listener.close(resolve))
    };
}

describe('TransomScaffold plugin', function () {
    let running;

    afterEach(async function () {
        if (running) {
            await running.close();
            running = null;
        }
    });

    it('is a single plugin instance', function () {
        expect(transomScaffold.constructor.name).to.equal('TransomScaffold');
        expect(Object.keys(transomScaffold)).to.deep.equal(['initialize']);
    });

    it('registers the route helpers even without a scaffold section', async function () {
        running = await startServer(null, {});
        const helpers = running.registry.get('transomScaffold');
        expect(Object.keys(helpers)).to.deep.equal(['addStaticAssetRoute', 'addRedirectRoute', 'addTemplateRoute']);
    });

    it('uses a custom registryKey and copies the scaffold section onto the options', async function () {
        const options = { registryKey: 'scaffolding' };
        const scaffold = { redirectRoutes: { path: '/a', target: '/b' } };
        running = await startServer(scaffold, options);
        expect(running.registry.has('scaffolding')).to.equal(true);
        expect(running.registry.has('transomScaffold')).to.equal(false);
        expect(options.scaffold).to.deep.equal(scaffold);
        expect(options.scaffold).to.not.equal(scaffold);
    });

    it('serves static routes given as a list', async function () {
        running = await startServer({
            staticRoutes: [
                { path: '/site', folder: 'test/fixtures/static' },
                { path: '/raw', folder: 'test/fixtures/static', appendRequestPath: false }
            ]
        });
        let res = await running.fetch('/site/');
        expect(res.status).to.equal(200);
        expect((await res.text()).trim()).to.equal('<h1>home</h1>');

        res = await running.fetch('/site/docs/');
        expect((await res.text()).trim()).to.equal('<h1>docs</h1>');

        res = await running.fetch('/site/notes.txt');
        expect((await res.text()).trim()).to.equal('plain text');

        // appendRequestPath: false means folders don't serve their index file.
        res = await running.fetch('/raw/');
        expect(res.status).to.equal(404);
        res = await running.fetch('/raw/notes.txt');
        expect(res.status).to.equal(200);
    });

    it('accepts a single static route, an explicit express.static and a defaultAsset', async function () {
        running = await startServer({
            staticRoutes: { path: '/one', folder: 'test/fixtures/static', serveStatic: express.static, defaultAsset: 'notes.txt' }
        });
        const res = await running.fetch('/one/');
        expect((await res.text()).trim()).to.equal('plain text');
    });

    it('adds redirect routes given as a list', async function () {
        running = await startServer({
            redirectRoutes: [
                { path: '/temporary', target: '/somewhere' },
                { path: '/moved', target: { pathname: '/new-home', permanent: true } },
                { path: '/object-temporary', target: { pathname: '/later' } }
            ]
        });
        let res = await running.fetch('/temporary');
        expect(res.status).to.equal(302);
        expect(res.headers.get('location')).to.equal('/somewhere');

        res = await running.fetch('/moved');
        expect(res.status).to.equal(301);
        expect(res.headers.get('location')).to.equal('/new-home');

        res = await running.fetch('/object-temporary');
        expect(res.status).to.equal(302);
        expect(res.headers.get('location')).to.equal('/later');
    });

    it('adds template routes named by their key, with defaults filled in', async function () {
        const scaffold = {
            About: { data: { who: 'Mark' } },
            Contact: { path: '/reach-us', templateName: 'ContactPage', contentType: 'text/plain' }
        };
        running = await startServer(scaffold);

        let res = await running.fetch('/about');
        expect(res.status).to.equal(200);
        expect(res.headers.get('content-type')).to.equal('text/html');
        expect(await res.text()).to.equal('About:Mark:params:headers');
        // The defaults are written onto the definition's own objects.
        expect(scaffold.About).to.include({ path: '/about', templateName: 'About', templateHandler: 'transomTemplate' });

        res = await running.fetch('/reach-us');
        expect(res.headers.get('content-type')).to.equal('text/plain');
        expect(await res.text()).to.equal('ContactPage::params:headers');
    });

    it('uses the configured template handler key', async function () {
        const scaffold = { Home: { path: '/' } };
        const app = express();
        const registry = new PocketRegistry();
        registry.set('transom-config.definition.scaffold', scaffold);
        await transomScaffold.initialize({ registry, get: app.get.bind(app), use: app.use.bind(app) }, { templateHandler: 'pages' });
        expect(scaffold.Home.templateHandler).to.equal('pages');
    });

    it('passes template errors to the error handler', async function () {
        running = await startServer({ Broken: {} });
        const res = await running.fetch('/broken');
        expect(res.status).to.equal(500);
        expect(await res.text()).to.equal('template failed');
    });
});

describe('TransomScaffold edge cases', function () {
    it('skips staticRoutes and redirectRoutes that are present but undefined', async function () {
        const registry = new PocketRegistry();
        registry.set('transom-config.definition.scaffold', { staticRoutes: undefined, redirectRoutes: undefined });
        const server = { registry, get: sinon.spy(), use: sinon.spy() };
        await transomScaffold.initialize(server, {});
        expect(server.get.called).to.equal(false);
        expect(server.use.called).to.equal(false);
    });

    it('resolves static folders from the application root outside of testing', function () {
        const path = require('path');
        const saved = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';
        try {
            const serveStatic = sinon.stub().returns('middleware');
            const server = { get: sinon.spy(), use: sinon.spy() };
            new ScaffoldHandler(server).addStaticAssetRoute(server, { path: '/x', folder: 'public', serveStatic });
            // The package is installed at <app>/node_modules/@transomjs/transom-scaffold.
            const appRoot = path.join(__dirname, '..', '..', '..', '..');
            expect(serveStatic.firstCall.args[0].directory).to.equal(path.join(appRoot, 'public'));
        } finally {
            process.env.NODE_ENV = saved;
        }
    });
});

describe('ScaffoldHandler without server.use', function () {
    it('registers static routes with server.get instead', function () {
        const server = { get: sinon.spy() };
        new ScaffoldHandler(server).addStaticAssetRoute(server, { path: '/assets', serveStatic: sinon.stub().returns('middleware') });
        expect(server.get.calledOnceWith('/assets', 'middleware')).to.equal(true);
    });
});
