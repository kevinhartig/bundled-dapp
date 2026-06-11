# Signet DApp Starter

A minimal reference implementation of a React application bundled as a [Signet](https://github.com/kevinhartig/signet) DApp. Use this as a starting point for building your own Signet DApp.

## What This Is

This project demonstrates the complete pattern for a bundled Signet DApp:

- A React app built with Next.js, used for local development and hot-reloading
- An `init(container, secureInterface)` function that Signet calls to mount the DApp
- A `prepare-bundle.js` script that builds a self-contained bundle (`dist/index.bundle.js`) from `init.tsx` using esbuild
- A mock Signet security interface in `page.tsx` for testing locally without a real Signet host

## Project Structure

```
src/app/
  init.tsx          # DApp entry point — the init() function Signet calls
  page.tsx          # Next.js dev page with mock Signet security interface
  global.ts         # Ensures window.DApp is set when the Next.js bundle loads
  components/
    DAppExport.tsx  # React component that keeps init() in the Next.js bundle

scripts/
  prepare-bundle.js # esbuild script that produces dist/index.bundle.js

dist/               # Bundle output (deploy these to the Signet marketplace)
  index.bundle.js
  index.css

manifest.json       # Signet DApp manifest
docs/               # Reference documentation
```

## Getting Started

Install dependencies:

```bash
yarn install
```

### Local Development

Run the Next.js dev server with a mock Signet security interface:

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000). The DApp renders in a mock container with a simulated `secureInterface`. By default the mock is enabled; append `?mock=0` to disable it.

### Building the DApp Bundle

Produce the deployable bundle in `dist/`:

```bash
yarn bundle
```

This runs esbuild directly on `src/app/init.tsx` and outputs:
- `dist/index.bundle.js` — the DApp bundle (React/ReactDOM are external, loaded by Signet)
- `dist/index.css` — CSS file (required by the manifest; this project uses inline styles)

## How It Works

Signet loads the bundle, then calls:

```js
window.DApp.init(container, secureInterface)
```

`container` is the DOM element Signet has prepared for the DApp. `secureInterface` is the [Signet secure interface object](./docs/Signet%20DApp%20Security%20Interface.md) providing access to profile data, wallet operations, and runtime parameters. The `init` function returns a cleanup function that Signet calls when the DApp is closed.

The `globalExport: "DApp"` field in `manifest.json` tells Signet the name of the global variable to look for.

## Deploying to Signet

1. Run `yarn bundle` to produce `dist/index.bundle.js` and `dist/index.css`
2. Copy `dist/`, `manifest.json`, and any other public assets to your deployment location in the [Signet Marketplace](https://github.com/kevinhartig/marketplace-app)
3. Update `manifestUrl` in `manifest.json` to the public URL where the manifest will be served

## Documentation

- [Bundled DApp Support](./docs/Bundled%20DApp%20Support.md) — manifest configuration, bundling, CSS scoping, loading order
- [Signet DApp Security Interface](./docs/Signet%20DApp%20Security%20Interface.md) — full API reference for the `secureInterface` object
