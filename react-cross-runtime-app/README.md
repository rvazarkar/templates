## Cross-runtime React app

A template for creating a [React](http://facebook.github.io/react) app which can
be developed in a browser, but will be distributed for other runtimes.

By default, it's set up for [io.js](https://iojs.org)/Chromium-based
[NW.js](https://github.com/nwjs/nw.js) apps and Internet Explorer-based
[HTML Application](http://en.wikipedia.org/wiki/HTML_Application) (HTA) apps.

### Browser

`server.js` configures a basic express server to serve the app from
`./dist/browser` and provides a route to proxy external API GET requests
through.

To use this, POST some JSON to `/proxy` with a `url` property. If you provide
`username` and `password` properties, the request will be authenticated using
basic auth.

### NW.js

A zipped `<appname>.nw` package will be created in `./dist/nwjs`.

This currently just reuses the browser bundle.

### HTML Application (HTA)

If you work in an organisation that runs Windows, an HTA is a handy way to
distribute browser-based tools as a single file, which needs nothing additional
installed to run and doesn't need to have a multi-MB runtime distributed with
it.

HTAs run Internet Explorer with the permissions of a "fully trusted"
application, bypassing cross-domain restrictions for HTTP requests and granting
access to the filesystem and, well... pretty much everything else on Windows
(e.g. you don't need the data: URI hack to export an HTML table to Excel when
you can create an `Excel.Application` object!)

Actually developing an app as an HTA is a hellish experience, so the goal of
this template is to allow you to develop the majority of the app in a proper
browser (keeping the limitations of IE in mind and learning new ones as you go!)
and only have to drop down to HTA for testing and HTA-only code.

For HTA, the build automates creation of a final HTA file which bundles all the
project's minified JavaScript and CSS into a single file.

### Other Runtimes

To add a new runtime, edit `gulpfile.js`:

* add the name you want to use for the runtime to the `RUNTIMES` list.
* implement distribution steps for the runtime in the `copy-dist` and `dist`
  tasks.

Optional step: create a [pull request](https://github.com/insin/templates/pulls)
with a generic setup for the new runtime!

### Directory structure

```
<app>
├── build               build directory
├── dist
│   ├── browser         final browser build
│   ├── hta             final HTA build
│   └── nwjs            final NW.js build
├── public
│   └── css
│       └── style.css   app-specific CSS
├── src
│   └── app.js          entrypoint for the application
├── templates
│   ├── index.html      template for browser & NW.js: handles .min.(css|js) extensions
│   └── <app>.hta       template for HTA, inlines all CSS & JS
├── vendor
│   └── css             vendored CSS (e.g. Bootstrap)
└── server.js           dev server
```

### npm scripts

**Note on dependencies:** you need to run `npm run deps` or `npm run dist` to
bundle dependencies the first time you use this template, and every time any CSS
or JS dependencies are changed.

* `npm run deps` - bundles CSS & JS dependencies into single files
* `npm run dist` - build all dependencies and create all runtime distributions
* `npm start` - run the dev server to serve up the browser version and proxy
  HTTP requests to external APIs

### [Gulp](https://github.com/gulpjs/gulp/) tasks

`gulp` or `gulp watch` will lint and rebuild (the browser version, by default)
every time anything in `/src`, `/public/css` or `/templates` is modified.

ES6 transforms will be run for all code by React's JSX transpiler.

If you break [browserification](https://github.com/substack/node-browserify) of
the source code (usually bad syntax or a bad `require()`) the build will beep
twice. It will beep once when the problem is subsequently fixed.

**Tasks which will need tweaks from app to app, based on dependencies:**

* `deps` - bundles all CSS and JavaScript dependencies into single files and
  create minified versions
   * `js-deps` - uses browserify `require()` calls to bundle (and alias, if
     necessary) JavaScript dependencies, installed via npm
   * `css-deps` - concatenates and minifies `/vendor/css`
* `build` - bundles app code, starting from `/src/app.js`. Dependencies from the
  `js-deps` tasks must be mirrored by calls to browserify's `external()` here.

**Flags which can be passed to the Gulp build:**

* `--production` - when passed, minified versions of CSS & JS will be generated
  and used. Otherwise, original versions will be used and the browser version's
  JavaScript will include a sourcemap.
* `--runtime=(browser|hta|nwjs)` - controls which version gets built. Defaults
  to `"browser"`. You should only need this if you want to build for a
  non-browser runtime on every change.

**Environment variables, `envify` and `uglify`**

The Gulp build sets up the following environment variables for use in your code.
The build uses [`envify`](https://github.com/hughsk/envify), so references to
these in your code will be replaced with a string containing the value of the
environment variable:

* `process.env.RUNTIME` - `"browser"`, `"hta"` or `"nwjs"`, depending on which
  version is being built
* `process.env.NODE_ENV` - `"development"` or `"production"`, depending on which
  version is being built
* `process.env.VERSION` - the contents of the version field from `package.json`

This allows you to fence off code for each version - e.g. to go through the dev
server's `/proxy` URL for the browser version but hit an API URL directly from
other versions, you might do something like:

```javascript
var req
if ('browser' === process.env.RUNTIME) {
  req = superagent.post('/proxy').send({
    url: url
  , username: credentials.username
  , password: credentials.password
  })
}
if ('browser' !== process.env.RUNTIME) {
  req = superagent.get(url).auth(credentials.username, credentials.password)
}

req.accept('json').end(function(err, res) {
// ...
```

When [`uglify`](https://github.com/mishoo/UglifyJS2) is run during a
`--production` build, its dead code elimination will identify code which will
never get executed for the runtime that's currently being built (which will now
look like, e.g `if ('hta' === "browser")`) and remove the code from the
minified version entirely.