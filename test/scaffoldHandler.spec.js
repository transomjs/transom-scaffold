"use strict";
const expect = require('chai').expect;
const sinon = require('sinon');
const path = require('path');
const ScaffoldHandler = require('../lib/scaffoldHandler');

describe('ScaffoldHandler', function () {

    it('should be an Object with three methods', function () {
        var dummyServer = {};
        dummyServer.get = sinon.spy();

        const scaffoldHandler = new ScaffoldHandler(dummyServer, {});

        expect(scaffoldHandler).to.be.an.instanceOf(Object);
        expect(scaffoldHandler.addStaticAssetRoute).to.be.an.instanceOf(Function);
        expect(scaffoldHandler.addRedirectRoute).to.be.an.instanceOf(Function);
        expect(scaffoldHandler.addTemplateRoute).to.be.an.instanceOf(Function);
        expect(Object.keys(scaffoldHandler).length).to.be.equal(3);
    });

    it('should setup three \'get\' routes on the server', function () {

        var dummyServer = {};
        dummyServer.get = sinon.spy();

        const scaffoldHandler = new ScaffoldHandler(dummyServer, {});
        const scaffoldA = {
            path: /(js|css|fonts|images)\/?.*/,
            folder: 'static-assets',
            serveStatic: sinon.spy(function (options) {
                return options;
            })
        };
        scaffoldHandler.addStaticAssetRoute(dummyServer, scaffoldA);

        const scaffoldB = {
            path: '/foo',
            target: '/bar'
        };       
        scaffoldHandler.addRedirectRoute(dummyServer, scaffoldB);

        const scaffoldC = {
            path: '/foo',
            redirect: '/bar'
        };               
        scaffoldHandler.addTemplateRoute(dummyServer, 'baz', scaffoldC);

        expect(dummyServer.get.calledThrice).to.be.true;

        dummyServer.get('one');
        expect(scaffoldA.serveStatic.calledOnce).to.be.true;
        const args = scaffoldA.serveStatic.args[0][0]; // first call, first arg.

        expect(args.appendRequestPath).to.be.true;
        expect(args.default).to.equal("index.html");
        const testPath = path.join(__dirname, "..", "static-assets");
        expect(args.directory).to.equal(testPath);

    });

    it('should setup a static asset route on the server', function () {
        var dummyServer = {};
        dummyServer.get = sinon.spy();

        const scaffoldHandler = new ScaffoldHandler(dummyServer, {});
        const scaffold = {
            serveStatic: sinon.spy(function (options) {
                return options;
            }),
            path: '/myPath',
            folder: 'my-assets',
            defaultAsset: 'default.png'
        };
        scaffoldHandler.addStaticAssetRoute(dummyServer, scaffold);
        expect(dummyServer.get.calledOnce).to.be.true;
        const uri = dummyServer.get.args[0][0]; // first call, first arg.
        expect(uri).to.be.equal('/myPath');

        dummyServer.get('/foo.jpg');
        expect(scaffold.serveStatic.calledOnce).to.be.true;
        const args = scaffold.serveStatic.args[0][0]; // first call, first arg.

        expect(args.appendRequestPath).to.be.true;
        expect(args.default).to.equal("default.png");
        const testPath = path.join(__dirname, "..", "my-assets");
        expect(args.directory).to.equal(testPath);
    });

    it('should setup a redirect route on the server', function () {
        var dummyServer = {};
        dummyServer.get = sinon.spy();

        const scaffoldHandler = new ScaffoldHandler(dummyServer, {});
        const scaffold = {
            path: '/piglet',
            target: '/redirectPath'
        };
        scaffoldHandler.addRedirectRoute(dummyServer, scaffold);
        expect(dummyServer.get.calledOnce).to.be.true;
        const uri = dummyServer.get.args[0][0]; // first call, first arg.
        expect(uri).to.be.equal('/piglet');
    });

    it('should setup a redirect route with path', function () {
        var dummyServer = {};
        dummyServer.get = sinon.spy();

        const scaffoldHandler = new ScaffoldHandler(dummyServer, {});
        const scaffold = {
            path: '/myPath',
            target: '/redirectPath'
        };
        scaffoldHandler.addRedirectRoute(dummyServer, scaffold);
        expect(dummyServer.get.calledOnce).to.be.true;
        const uri = dummyServer.get.args[0][0]; // first call, first arg.
        expect(uri).to.be.equal('/myPath');

        const fn = dummyServer.get.args[0][1]; // first call, second arg.
        const res = {
            redirect: sinon.spy()
        };
        const next = sinon.spy();
        fn({}, res, next);
        expect(res.redirect.calledOnce).to.be.true;
        const redirectArgs = res.redirect.args[0];
        expect(redirectArgs[0]).to.equal(scaffold.target);
    });

    it('should setup a template route with data and headers', function (done) {
        var dummyServer = {
            registry: {
                get: function () {
                    return {
                        renderHtmlTemplate: function (templateName, data) {
                            let result = templateName;
                            Object.keys(data).sort().map((key) => {
                                result += `\n${key}:${data[key]}`;
                            });
                            return result;
                        }
                    }
                }
            }
        };
        dummyServer.get = sinon.spy();

        const scaffoldHandler = new ScaffoldHandler(dummyServer, {});
        const scaffold = {
            contentType: 'apple/pear',
            templateName: 'fooTemplate',
            data: {
                foo: 123,
                bar: 'baz'
            }
        };
        scaffoldHandler.addTemplateRoute(dummyServer, "hippo", scaffold);
        expect(dummyServer.get.calledOnce).to.be.true;
        const uri = dummyServer.get.args[0][0]; // first call, first arg.
        expect(uri).to.be.equal('/hippo');
        const fn = dummyServer.get.args[0][1];
        const req = {
            headers: "jazz",
            params: "cookie"
        };
        const res = {
            setHeader: sinon.spy(),
            end: sinon.spy(),
        };

        fn(req, res, function () {
            expect(res.setHeader.calledOnce).to.be.true;
            const setHeaderArgs = res.setHeader.args[0];
            expect(setHeaderArgs[0]).to.equal('content-type');
            expect(setHeaderArgs[1]).to.equal(scaffold.contentType);

            expect(res.end.calledOnce).to.be.true;
            const endArgs = res.end.args[0];
            const dummy = 'fooTemplate\nbar:baz\nfoo:123\nheaders:jazz\nparams:cookie';
            expect(endArgs[0]).to.equal(dummy);
            done();
        });
    });

});