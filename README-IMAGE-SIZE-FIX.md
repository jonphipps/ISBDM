# Fix for Image-Size ArrayBuffer Error

## Problem

The project was encountering the following error when running `yarn start`:

```
TypeError [ERR_INVALID_ARG_TYPE]: The "buffer" argument must be an instance of Buffer, TypedArray, or DataView. Received an instance of ArrayBuffer
    at Object.read (node:fs:640:3)
    at /Users/jonphipps/Code/ISBDM/.pnp.cjs:25448:19
    at new Promise (<anonymous>)
    at NodeFS.readPromise (/Users/jonphipps/Code/ISBDM/.pnp.cjs:25447:18)
    at ZipOpenFS.readPromise (/Users/jonphipps/Code/ISBDM/.pnp.cjs:25918:32)
    at VirtualFS.readPromise (/Users/jonphipps/Code/ISBDM/.pnp.cjs:25159:30)
    at PosixFS.readPromise (/Users/jonphipps/Code/ISBDM/.pnp.cjs:25159:30)
    at NodePathFS.readPromise (/Users/jonphipps/Code/ISBDM/.pnp.cjs:25159:30)
    at FileHandle.read (/Users/jonphipps/Code/ISBDM/.pnp.cjs:26871:45)
    at readFileAsync (/Users/jonphipps/.yarn/berry/cache/image-size-npm-1.2.1-e285f3c080-10c0.zip/node_modules/image-size/dist/index.js:58:22)
```

This issue occurs because the `image-size` module (version 1.2.1, used by Docusaurus) was not correctly handling ArrayBuffer objects when processing images.

## Solution

We implemented a module patching approach that:

1. Intercepts the `image-size` module when it's loaded
2. Adds wrapper functions that convert ArrayBuffer instances to Buffer instances
3. Returns the patched module

## Implementation

1. Created custom patch scripts:
   - `src/utils/image-size-patch.js`: Contains the code to patch the image-size module
   - `start-patched.js`: Modified start script that loads the patch before starting Docusaurus
   - `build-patched.js`: Modified build script that loads the patch before building

2. Updated package.json scripts:
   - `yarn start` now uses the patched version
   - `yarn build` now uses the patched version
   - Added `start:original` and `build:original` for the original commands

## Usage

Simply use the regular commands:

```bash
yarn start
yarn build
```

If you need to run the original, unpatched versions:

```bash
yarn start:original
yarn build:original
```

## How It Works

The patch works by overriding Node.js's module require system to intercept requests for the `image-size` module. When the module is loaded, we replace its functions with versions that ensure ArrayBuffer instances are converted to Buffer instances before being processed.

This allows Docusaurus to properly process images without error during development and build processes.