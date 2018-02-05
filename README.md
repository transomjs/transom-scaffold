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
			static: true
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

## Scaffold options
The options can be passed in to the configure as above, or the `scaffold` object can be created as a property of the `definition` object in your ai definition.
Each property of `scaffold` is a path of static content that can be served, either as files, or as templeted content. The property name is the physical folder on the disk where the files are located. By default, it is assumed that you will create one or more of the folders `css`,`js`,`fonts` or `images` in that folder on the disk. If you have other content, then you need to include a `path` property with the corresponding regex to match on. For example, a folder containing pdf files might be configured as follows:

```javascript
scaffold: {
	"assets": {
		static: true,
		path:  /pdf\/?.*/
	}
}
``` 
In this case the files are physically located in a folder named 'pdf' under the folder 'assets'. The url to access a pdf will be `https://URL_Prefix/pdf/pdfFileName.pdf`

If you need to have a second definition of static content, located in the same physical folder on the disk, then you may use the `assetPath` property as follows:

```Javascript
scaffold: {
	"assets-definition-2": {
		static: true,
		assetPath: "assets",
		path:  /somethingelse\/?.*/
	}
}
```