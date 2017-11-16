# transom-scaffold
Add routes for template based content, and static assets to your Transom API server.

[![Build Status](https://travis-ci.org/transomjs/transom-scaffold.svg?branch=master)](https://travis-ci.org/transomjs/transom-scaffold)

## Installation

```bash
$ npm install --save @transom/transom-scaffold
```

## Usage

```
const myApi = require('./myApi');

const Transom = require('@transomjs/transom-core');
const transomScaffold = require('@transomjs/transom-scaffold');
const transom = new Transom();

transom.configure(transomScaffold, {
	scaffold: {
		assets: {
			static: true,
			assetPath: 'static-assets'
		},
		person: {
			templateName: "Person",
			data: {
				pageTitle: "Person",
				appName: 'Transom Scaffold Demo',
				anything: '/v1/db/person'
			}
		}	
	}
});

const server = transom.initialize(myApi);
```
