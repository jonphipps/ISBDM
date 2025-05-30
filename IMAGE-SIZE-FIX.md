# Fixing ArrayBuffer Issue with image-size in Docusaurus

This project encountered an issue with the `image-size` module when using Yarn Berry in PnP mode:

```
TypeError [ERR_INVALID_ARG_TYPE]: The "buffer" argument must be an instance of Buffer, TypedArray, or DataView. Received an instance of ArrayBuffer
```

## Solution

The simplest solution was to switch from Yarn Berry's PnP mode to the traditional node_modules resolution strategy:

1. Create or modify `.yarnrc.yml` in the project root with:

```yaml
nodeLinker: node-modules
```

2. Reinstall dependencies:

```bash
yarn
```

3. Update package.json scripts to use the original Docusaurus commands:

```json
"scripts": {
  "start": "docusaurus start",
  "build": "docusaurus build",
  "start:patched": "node start-patched.js",
  "build:patched": "node build-patched.js"
}
```

This resolved the ArrayBuffer conversion issue by avoiding the PnP module resolution system that caused conflicts with the `image-size` module's handling of binary data.

## Technical Root Cause

The issue occurs because:

1. Yarn Berry's PnP mode virtualizes the node_modules structure and uses custom module resolution
2. The `image-size` module uses Node.js filesystem APIs to read image data as buffers
3. In PnP mode, there's a compatibility issue between ArrayBuffer and Buffer conversions in the fs module

The traditional node_modules approach resolves this by using Node's standard module resolution, which has better compatibility with modules that make assumptions about Node.js internals.

## Alternative Approach (Not Needed)

Several patches were created to try to fix the issue while keeping PnP mode:

- `src/utils/buffer-patch.js`: Enhances Buffer.from to handle ArrayBuffers
- `src/utils/filehandle-patch.js`: Patches FileHandle.read to convert ArrayBuffers
- `src/utils/image-size-direct-patch.js`: Directly intercepts the image-size module

These patches are no longer necessary but are kept for reference and can be used with:

```bash
yarn start:patched
# or
yarn build:patched
```