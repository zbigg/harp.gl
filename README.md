# harp.gl

`harp.gl` is an open-source 3D map rendering engine.

You can use this engine to:

  * Develop visually appealing 3D maps
  * Create highly animated and dynamic map visualization with WebGL, using the popular [THREE.js](https://threejs.org/) library.
  * Create themeable maps, with themes that can change on the fly.
  * Create a smooth map experience with highly performant map rendering and decoding. Web workers parallelize the CPU intensive tasks, for optimal responsiveness.
  * Design your maps modularly, where you can swap out modules and data providers as required.

## About This Repository

This repository is a monorepo containing the core components of `harp.gl`,
organized in a `yarn workspace`.

All components can be used stand-alone and are in the `@here` subdirectory.

## Installation

### In Node.js

All `harp.gl` modules are installable via npm (or yarn):

```sh
npm install @here/harp-mapview
```

### In Browser

Since `harp.gl` consists of a set of modules, there are no ready-made bundles available. Take a look at the examples on information on how to use tools like `webpack` to create a bundle for the browser.

## Development

### Prerequisites

* __Node.js__ - Please see [nodejs.org](https://nodejs.org/) for installation instructions
* __Yarn__ -  Please see [yarnpkg.com](https://yarnpkg.com/en/) for installation instructions.

### Download dependencies

Run:

```sh
yarn install
```

to download and install all required packages and set up the yarn workspace.

### Launch development server for harp.gl examples

Run:

```
yarn start
```

To launch `webpack-dev-server`. Open `http://localhost:8080/` in your favorite browser.

### Launch development server for unit tests

Run:

```
yarn start-tests
```

Open `http://localhost:8080/` in your favorite browser to run the tests.

### Run unit tests in Node.js environment

Run:

```
npm test
```

## License

Copyright (C) 2018 HERE Europe B.V.

See the [LICENSE](./LICENSE) file in the root of this project for license details about using `harp.gl`.

In addition, see the following license limitations for using `harp.gl` with data sources not provided by [HERE](https://www.here.com):

* [fonts](https://github.com/heremaps/harp-font-resources)
* assets
* themes

For other use cases not listed in the license terms, please [contact us](https://developer.here.com/contact-us).
