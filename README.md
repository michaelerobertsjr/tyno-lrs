# Typescript NodeJS Learning Record Store

This project provides a good example of how to use TypeScript with NodeJS & Friends (Express) 
in a TDD development cycle.

It contains a server app which demonstrates best practices for developing an API using TypeScript.
This means classes with imports and proper typed functions and members.

Of course [Express](http://expressjs.com/) is used for the server aspect right now, 
but in the future, who knows, it might be [Koa](http://koajs.com/).

For the testing we use the [Mocha](https://mochajs.org/) test framework with [Chai](http://chaijs.com/api/) for assertions.
We are using the BDD expect call to assert truthy or falsy conditions in the tests.
This can be configured using the chai object.
* The Expect / Should API covers the BDD assertion styles.
* The Assert API covers the TDD assertion style.

To use this server program, you will need gulp, node and npm installed.
Use these commands:
```
$ npm i  
$ gulp watch
$ npm test
$ npm start
```


## Table of contents

1. [dev](#dev)
1. [toBase64](#toBase64)
2. [xAPI configuration](#xAPI-configuration)
2. [xAPI installation](#xAPI-installation)
2. [Project setup](#project-setup)


## <a name="using-a-lib">Using a lib</a>

There is a [good example here](https://github.com/Microsoft/TypeScript/issues/247) with a section called "Example for node_modules"

And verbatim I will quote it:

If we had:
```
./node_modules/concator/index.ts
./myApp.ts
```
And in index.ts we had:
```
export function concat(param1: string, param2:string): string {
      return param1 + ' ' + param2;
}
```
in myApp.ts:
```
import concator = require('concator');  // loads the module from node_modules
var result = concator.concat('I like', 'this.');
var wontWork = concator.concat('this will fail');  // compile error, concat needs 2 params
```

However, we do not have index.ts, we have index.js, which has this:
```
    exports = module.exports = toExport;
    exports.ADL = toExport;
```

So how can we use this lib, TypeScipt-wise?
These, similar to what is used in the index.js file, but with the correct paths for the node modules seems to be working:
```
var xAPIWrapper = require('../../node_modules/xAPIWrapper/src/xapiwrapper');
var xAPIStatement = require('../../node_modules/xAPIWrapper/src/xapistatement');
var verbs = require('../../node_modules/xAPIWrapper/src/verbs');
var xAPILaunch = require('../../node_modules/xAPIWrapper/src/xapi-launch');
var xapiutil = require('../../node_modules/xAPIWrapper/src/xapi-util');
```

But now crypto is a problem.
The way we are using it has a red squiggly under the path section:
```
import * as CryptoJS from '../../node_modules/xAPIWrapper/lib/cryptojs_v3.1.2';
```

An answer of SO shows this:
```
import * as CryptoJS from '../../../node_modules/crypto-js';
```
or
```
import CryptoJS = require('crypto-js');
```

Copying the path to that file shows this: 
/Users/tim/node/typescript-api/node_modules/xAPIWrapper/lib/cryptojs_v3.1.2.js

This has no squiggly:
```
var crypto = require('../../node_modules/xAPIWrapper/lib/cryptojs_v3.1.2');
```
But the var the code is looking for is crypto-js, which is an illegal var name.
Actually it's a module name:
```
Error: Cannot find module 'crypto-js'
```

In case you are wondering, the version suggested [on SO](http://stackoverflow.com/questions/38479667/import-crypto-js-in-an-angular-2-project-created-with-angular-cli) 
above both have red squigglies on them.

The next answer on the page has an edit that suggests this:
```
const map: any = {
    'crypto-js': '../../node_modules/xAPIWrapper/lib/cryptojs_v3.1.2'
};
/** User packages configuration. */
const packages: any = {
    'crypto-js': {
        format: 'cjs',
        defaultExtension: 'js',
        main: 'crypto-js.js'
    }
};
```

This looks promising, but doesn't work.  Same error when running the tests tho there are no squigglies.

This version also fails:
```
const map: any = {
    'crypto-js': '../../node_modules/xAPIWrapper/lib/cryptojs_v3.1.2'
};
import CryptoJS from 'crypto-js';
```

What next?  [This page](https://www.snip2code.com/Snippet/28724/Using-crypto-js-in-node-js-with-Typescri) 
recommends adding code to the actual crypto d.ts file (not very maintainable!).

Install typings for crypto-js:
$ typings install --ambient crypto-js

This was all three years ago.  Typings have moved on since then.


Ditching the crypto from the xAPI lib, and trying this:
```
$ npm install crypto-js --save
```
And then:
```
import * as CryptoJS from '../../node_modules/crypto-js';
```

And anyhow, the error is from the test, so maybe this import needs to be in the test file?
Still doesn't help.

What gives?  It doesn't even look like the lib is being used anywhere.

Looking in more detail, its not either our code or the xAPI code that is causing this error:

/Users/tim/node/typescript-api/node_modules/ts-node/dist/index.js:160
                    throw new TSError(formatDiagnostics(diagnosticList, cwd, ts, lineOffset));
                    ^
TSError: ⨯ Unable to compile TypeScript
test/xAPI.test.ts (7,27): Cannot find module '/Users/tim/node/typescript-api/node_modules/crypto-js/crypto-js'. (2307)

Here is the section that is requiring the code:
```
function getCacheName(sourceCode, fileName) {
    return crypto.createHash('sha1')
        .update(path_1.extname(fileName), 'utf8')
        .update('\0', 'utf8')
        .update(sourceCode, 'utf8')
        .digest('hex');
}
function getCompilerDigest(opts) {
    return crypto.createHash('sha1').update(JSON.stringify(opts), 'utf8').digest('hex');
}
```

We installed ts-node in Step 4: TDD
```
$ npm install ts-node@1.6.1 --save-dev
```

This is the full description of why we need ts-node: 
If we write out tests in .ts files, we’ll need to make sure that Mocha can understand them. By itself, Mocha can only interpret JavaScript files, not TypeScript. There are a number of different ways to accomplish this. To keep it simple, we’ll leverage ts-node, so that we can provide TypeScript interpretation to the Mocha environment without having to transpile the tests into different files. ts-node will interpret and transpile our TypeScript in memory as the tests are run.

But still, why does this require crypto, and why is it breaking now?  
It ran from step 4 onwards, and during early testing of the xAPI code.

We took out the test that started causing all the trouble, and sure enough, the other tests pass again.
We put that test back in, and all of a sudden, the tests run and the problem test fails.

```
  1 failing

  1) xAPI tests configuration should return a created statement:
     TypeError: xAPIStatement.Agent is not a function
      at Wrapper.createStatement (src/xapi/Wrapper.ts:32:5)
      at Context.<anonymous> (test/xAPI.test.ts:25:33)
```

So do we also need to import Agent?  Again with the imports!






## <a name="generating-statements">Generating statements</a>

After settling on a way to import the library, we now want to create our first statement.
We created a config object (which didn't actually require the lib) in xAPI.test.ts like this:
```
import * as xapi from '../src/xapi/Wrapper';
...
let wrapper = new xapi.Wrapper();
```

In Wrapper.ts:
```
var xAPIWrapper = require('../../node_modules/xAPIWrapper/dist/xapiwrapper.min');
...
let statement = new xAPIWrapper.ADL.XAPIStatement(actor, verb, object);
```

The last line there breaks the test with this error:
```
TypeError: Cannot read property 'XAPIStatement' of undefined
```

So how to get a handle on the ADL object used in the examples?
That should be imported and available with the require statement, no?


## <a name="dev">Dev</a>

To watch the files for changes and re-load:
```
$ npm start
```

To run the unit tests:
```
$ npm test
```

## <a name="toBase64">toBase64</a>

In the [xAPIWrapper docs](https://github.com/adlnet/xAPIWrapper) in the COnfiguration section, 
this line is in a try catch block:
```
conf['auth'] = "Basic " + toBase64('tom:1234');
```

toBase64 is not liked by NodesJS or VSCode.  Where does that function come from?
The [MDN docs](https://developer.mozilla.org/en/docs/Web/API/WindowBase64/Base64_encoding_and_decoding) 
show using btoa() to create a base-64 encoded ASCII string from a "string" of binary data.
toBase64 may be a crypto thing which xAPI states as a dependency in its docs.

When we test the getConfig function which uses btoa(), we get this error:
```
Exception in Config trying to encode auth: ReferenceError: btoa is not defined
```

If you look in the xAPIWrapper source, you will find this:
```
function toBase64(text) {
    // if (CryptoJS && CryptoJS.enc.Base64)
        return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Latin1.parse(text));
    // else
    //     return Base64.encode(text);
}
```

After getting a few tests running, this log comment shows up:
```
Exception in Config trying to encode auth: ReferenceError: btoa is not defined
```

But isn't that a regular JavaScript function?
Maybe it's only a Mozilla thing and not supported in Node?
That would be weird.
[Can I use](http://caniuse.com/#feat=atob-btoa) shows full coverage.
What gives.


## <a name="xAPI-configuration">xAPI configuration</a>


Then we create a new xapi/Wrapper class to hold xAPI functions.
Trying to test a function on this class gives the following error in VSCode:
```
Property 'xApiConfig' does not exist on type 'typeof "/Users/tim/node/typescript-api/src/xapi/Wrapper"'.
```

Runing npm test give this error:
```
has no default export
```

Tha App.ts class has this at the end:
```
export default new App().express;
```

We are doing this:
```
export class Wrapper 
```

In Angular 2, that is enough to expose all the functions of the calls.

If we try this:
```
export default new Wrapper();
```

Then we get the same error we got during the xAPI installation section:
```
Error: Cannot find module '../node_modules/xAPIWrapper/dist/xapiwrapper.min'
```

This second error is because now, during testing, the lib is in its compiled location, and we need to do this:
```
var xAPIWrapper = require('../../node_modules/xAPIWrapper/dist/xapiwrapper.min');
```

Then, the tests run, and we get this result:
```
  6 passing (92ms)
  1 failing
  1) xAPI tests configuration should run:
     AssertionError: expected undefined to exist
      at Context.<anonymous> (test/xAPI.test.ts:14:31)
```

That is the red squiggle:
```
[ts] Property 'xApiConfig' does not exist on type 'typeof "/Users/tim/node/typescript-api/src/xapi/Wrapper"'.
(method) Wrapper.xApiConfig(): any
```
in the test we we do this:
```
let config = wrapper.xApiConfig();
```

Only, it seems to know the signature of the function: (method) Wrapper.xApiConfig(): any

Yet its called a property in one line and a method in the next.

We could try this in the xAPI.test.ts:
```
var xAPIWrapper = require('../src/xapi/Wrapper');
```

That makes the red squiggly go away, but the test fails with the message:
```
     TypeError: xAPIWrapper.xApiConfig is not a function
      at Context.<anonymous> (test/xAPI.test.ts:13:34)
```

If this is done:
```
        let wrap = new xAPIWrapper();
        let config = wrap.xApiConfig();
```

The error is:
```
 TypeError: xAPIWrapper is not a function
```

That's the actual wrapper object, so it still looks like the Wrapper class is not being imported properly.

If we try this double whammy in the test:
```
import * as xapi from '../src/xapi/Wrapper';
...
        let wrapper = new xapi.Wrapper();
        expect(wrapper).to.exist;
```

The test passes!

But actually trying to use the lib still does not work.

Let's go thru the different styles.  We're looking at [this explanation](https://www.exratione.com/2015/12/es6-use-of-import-property-from-module-is-not-a-great-plan/) 
of imports:

```
// Import the default export of a module.  
import xAPIWrapper from '../../node_modules/xAPIWrapper/src/xapiwrapper';

// Import all exports from a module as properties of an object.
import * as xapi from '../../node_modules/xAPIWrapper/src/xapiwrapper';

// These two formats are not discussed.
var xAPIWrapper = require('../../node_modules/xAPIWrapper/src/xapiwrapper');
import xAPIWrapper = require('../../node_modules/xAPIWrapper/src/xapiwrapper');
```

It also depends on how the library is exported.  
Since xapiwrapper.js is not in TypeScript, it doesn't have to play by typescript rules.

At the end of the file it does this:
```
module.exports = new XAPIWrapper(Config(), false);
```

The index.js file in the xAPIWrapper/src directory does this:
```
var xAPIWrapper = require('./xapiwrapper');
var xAPIStatement = require('./xapistatement');
var verbs = require('./verbs');
var xAPILaunch = require('./xapi-launch');
var xapiutil = require('./xapi-util');
var toExport = {
  XAPIWrapper: xAPIWrapper,
  XAPIStatement: xAPIStatement,
  verbs: verbs,
  launch: xAPILaunch,
  xapiutil: xapiutil
};
(function() {
  var root = this;
  if( typeof window === 'undefined' ) {
    exports = module.exports = toExport;
    exports.ADL = toExport;
  } else {
    root.ADL = toExport;    // this attaches to the window
    window.ADL = toExport;
  }
}).call(this);
```

So what does that mean for the way it should be imported into TypeScript?

[This issue]() recommends using this in the tsconfog.json file:
```
"moduleResolution": "classic"
```

But that will break previous imports:
```
TSError: ⨯ Unable to compile TypeScript
src/App.ts (2,26): Cannot find module 'express'. (2307)
src/App.ts (3,25): Cannot find module 'morgan'. (2307)
src/App.ts (4,29): Cannot find module 'body-parser'. (2307)
```

So the jury is still out on how to best use this lib.



## <a name="xAPI-installation">xAPI installation</a>

We want to use the [xAPI wrapper]() from [ADL](https://www.adlnet.gov/) (Advanced Distributed Learnining). 
Despite it's military slant, this is a great API for educational apps. 
They have experimental support for NodeJS modules [here](https://github.com/adlnet/xAPIWrapper/issues/67)

```
$ npm install https://github.com/zapur1/xAPIWrapper.git
```

But then how to import that our App.ts file?

import xAPIWrapper from './node_modules/xAPIWrapper/dist/xapiwrapper.min';
import xAPIWrapper = require('xAPIWrapper');
import * as xAPIWrapper from 'xAPIWrapper';

In the rainbow connection app, we use this method:
```
import { XapiComponent } from './xapi/xapi.component';
```
But we get this error:
```
(index):17 Error: (SystemJS) Can't resolve all parameters for XapiComponent: (?).(…)
```

In this app, the compiler complains:
```
TSError: ⨯ Unable to compile TypeScript
src/App.ts (6,25): Cannot find module 'xAPIWrapper'. (2307)
```

It would be nice however to just use non-relative module resolution.
[This guide](https://basarat.gitbooks.io/typescript/content/docs/quick/nodejs.html) 
has similar instructions fro the M. Herman blog.
[Here are the official docs](https://www.typescriptlang.org/docs/handbook/module-resolution.html) regarding 
the subject.  

We can get the app to compile using the old style:
```
var xAPIWrapper = require('./node_modules/xAPIWrapper/dist/xapiwrapper.min');
```

But this will never give us typings, which, for this lib, there probably are none anyhow.
What happened to introspection?  Oh, right, that's Java not Javascript.
And even though VSCode accepts that now, we still get the 'Cannot find module' error during npm test.

That's becuase the path should go up one level '../node_modules'.  Then the tests run.


## <a name="Project-setup">Project setup</a>

To set up a project like this, follow along with this friendly blog by Michael Herman:
[Developing a RESTful API With Node and TypeScript](http://mherman.org/blog/2016/11/05/developing-a-restful-api-with-node-and-typescript/#.WC7TEqJ96Rt).

These are the steps go setup a TypeScript NodeJS TDD API. 
When it says 'touch <filename>', that means create the file with the contents from the tutorial mentioned above. 
You can get the contents from this repo (although its contents will have changed from the bare basics), 
or from the GitHub [repo here]](https://github.com/mjhea0/typescript-node-api).
You could also get the files from Michael Herman's blog post, or the bare basics for TypeScript [here](https://basarat.gitbooks.io/typescript/content/docs/quick/nodejs.html) 

Now, on with the show!

### Step 1: TypeScript
```
$ touch tsconfig.json
$ mkdir src
$ npm init -y
$ npm install typescript@2.0.6 --save-dev
$ node_modules/.bin/tsc
```

### Step 2: Gulp
```
$ npm install gulp@3.9.1 gulp-typescript@3.1.1 --save-dev
$ touch gulpfile.json
```

### Step 3: Express
```
$ npm install express@4.14.0 debug@2.2.0 --save
$ npm install @types/node@6.0.46 @types/express@4.0.33 @types/debug@0.0.29 --save-dev
$ touch src/index.tsc
$ touch src/App.ts
$ npm install express@4.14.0 body-parser@1.15.2 morgan@1.7.0 --save
$ npm install @types/body-parser@0.0.33 @types/morgan@1.7.32 --save-dev
$ gulp scripts
$ npm start
```

### Step 4: TDD
```
$ npm install mocha@3.1.2 chai@3.5.0 chai-http@3.0.0 --save-dev
$ npm install @types/mocha@2.2.32 @types/chai@3.4.34 @types/chai-http@0.0.29 --save-dev
$ npm install ts-node@1.6.1 --save-dev
$ touch test/helloWorld.test.ts
$ npm test
```

### Step 5: Add Routes
```
// add some more tests.
$ touch src/data.json
$ touch src/routes/HeroRourter.ts
$ npm test
```

### Step 6: Second Endpoint

1. Create a method on HeroRouter that takes the arguments of your typical Express request handler: request, response, and next.
2. Implement the server’s response for the endpoint.
3. Inside of init, use HeroRouter’s instance of the Express Router to attach the handler to an endpoint of the API.



## Testing woes

```
$ npm test

> typescript-api@1.0.0 test /Users/timcurchod/repos/tyno-lrs
> mocha --reporter spec --compilers ts:ts-node/register test/**/*.test.ts


/Users/timcurchod/repos/tyno-lrs/node_modules/ts-node/src/index.ts:312
          throw new TSError(formatDiagnostics(diagnosticList, cwd, ts, lineOffset))
                ^
TSError: ⨯ Unable to compile TypeScript
src/xapi/Wrapper.ts (7,28): Cannot find module '../../node_modules/crypto-js/crypto-js'. (2307)
src/xapi/Wrapper.ts (18,35): Cannot find name 'toBase64'. (2304)
    at getOutput (/Users/timcurchod/repos/tyno-lrs/node_modules/ts-node/src/index.ts:312:17)
npm ERR! Test failed.  See above for more details.
mac-dog:tyno-lrs timcurchod$ 
```

Had to get rid of crypto and the toBase64 call in Wrapper as well as for the test in xAPI.test.ts.
It reiles on toBase64() used in the Wrapper.ts file for setting the conf['auth'] value.

Also, the data file was not copied over in the build process.
I need to be in the dist lib.
