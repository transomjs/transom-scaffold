# Transom Scaffold
Add routes for static assets, redirects and template based content to your Transom server. 

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
		staticRoutes: [{
			path: /(js|css|fonts|images)\/?.*/,
			folder: 'static-assets'
		}],
		redirectRoutes: [{
				path: '/',
				target: '/login'
			},
			{
				path: '/dummy',
				target: '/login'
			}
		],
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

## Scaffold options
The options can be passed in to the configure as above, or the `scaffold` object can be created as a property of the `definition` object in your Transom configuration. There are two named attributes of scaffold that have special meaning.

#### staticRoutes
StaticRoutes is an Array of Objects used to create GET routes to serve static content. Each route must include a `path` and a `folder` in the application root where static content can be stored. The path can be a regex, or a string and is used to create a new route to files stored in the specified folder.

```javascript
  scaffold: {
    staticRoutes: [{
      path: /(js|fonts|images)\/?.*/,
      folder: 'static-assets'
    }],
  }
```
Translates to routes which serve the following files:
 * `http://localhost:7000/js/apiclient.js` &#8680; `/static-assets/js/apiclient.js`
 * `http://localhost:7000/fonts/comic-sans.ttf` &#8680; `/static-assets/fonts/comic-sans.ttf`
 * `http://localhost:7000/images/logo.png` &#8680; `/static-assets/images/logo.png`



#### redirectRoutes
RedirectRoutes is an Array of Objects used to create GET routes that redirect to the target. Each route must include a `path` which is used to create routes that redirect to the location specified by the `target`.

```javascript
  scaffold: {
    redirectRoutes: [{
      path: '/',
      target: '/login'
    },
    {
      path: '/dummy',
      target: '/foobar'
    }]
  }
```
Translates to routes which redirect to the following URLs:
 * `http://localhost:7000` &#8680; `http://localhost:7000/login`
 * `http://localhost:7000/dummy` &#8680; `http://localhost:7000/foobar`


#### Additional Properties
Each additional property of `scaffold` is used to create a GET route that renders the template identified by `templateName`. Scaffold uses a template handler such as the one provided by [TransomEJSTemplate](https://transomjs.github.io/docs/transom-ejs-template/) to load the template and feed it the content of the `data`attribute. 


## Examples that use this plugin
 * [Transom Scaffold Example](https://github.com/binaryops-wiebo/transom-scaffold-example)
 * [Transom Secured Server Functions Example](https://github.com/binaryops-wiebo/transom-functions-secured-example)