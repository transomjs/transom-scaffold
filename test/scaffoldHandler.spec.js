"use strict";
const expect = require('chai').expect;
const sinon = require('sinon');
const path = require('path');
const ScaffoldHandler = require('../lib/scaffoldHandler');

describe('ScaffoldHandler', function () {

    // beforeEach(function () {
    // });

    // afterEach(function () {
    // });

    it('should be an Object with three methods', function () {
        var dummyServer = {};
        dummyServer.get = sinon.spy();

        const scaffoldHandler = new ScaffoldHandler(dummyServer, {});

        expect(scaffoldHandler).to.be.an.instanceOf(Object);
        expect(scaffoldHandler.addStaticAssetRoute).to.be.an.instanceOf(Function);
        expect(scaffoldHandler.addRedirectRoute).to.be.an.instanceOf(Function);
        expect(scaffoldHandler.addTemplateRoute).to.be.an.instanceOf(Function);
        // expect(Object.keys(scaffoldHandler).length).to.be.equal(3);
    });

    it('should setup three \'get\' routes on the server', function () {

        // const reqHandler = function (req, res, next) {
        //     // console.log("args:", arguments);
        // };

        var dummyServer = {};
        dummyServer.get = sinon.spy();

        const scaffoldHandler = new ScaffoldHandler(dummyServer, {});
        const scaffold = {
            serveStatic: sinon.spy(function (options) {
                return options;
            })
        };
        scaffoldHandler.addStaticAssetRoute(dummyServer, "one", scaffold);
        scaffoldHandler.addRedirectRoute(dummyServer, "two", scaffold);
        scaffoldHandler.addTemplateRoute(dummyServer, "three", scaffold);

        expect(dummyServer.get.calledThrice).to.be.true;

        dummyServer.get('one');
        expect(scaffold.serveStatic.calledOnce).to.be.true;
        const args = scaffold.serveStatic.args[0][0]; // first call, first arg.

        expect(args.appendRequestPath).to.be.true;
        expect(args.default).to.equal("index.html");
        const testPath = path.join(__dirname, "..", "one");
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
            defaultAsset: 'default.png'
        };
        scaffoldHandler.addStaticAssetRoute(dummyServer, "horse", scaffold);
        expect(dummyServer.get.calledOnce).to.be.true;
        const uri = dummyServer.get.args[0][0]; // first call, first arg.
        expect(uri).to.be.equal('/myPath');

        dummyServer.get('/foo.jpg');
        expect(scaffold.serveStatic.calledOnce).to.be.true;
        const args = scaffold.serveStatic.args[0][0]; // first call, first arg.

        expect(args.appendRequestPath).to.be.true;
        expect(args.default).to.equal("default.png");
        const testPath = path.join(__dirname, "..", "horse");
        expect(args.directory).to.equal(testPath);
    });

    it('should setup a redirect route on the server', function () {
        var dummyServer = {};
        dummyServer.get = sinon.spy();

        const scaffoldHandler = new ScaffoldHandler(dummyServer, {});
        const scaffold = {
            // path: '/myPath',
            redirect: '/redirectPath'
        };
        scaffoldHandler.addRedirectRoute(dummyServer, "piglet", scaffold);
        expect(dummyServer.get.calledOnce).to.be.true;
        const uri = dummyServer.get.args[0][0]; // first call, first arg.
        expect(uri).to.be.equal('/piglet');
    });

});