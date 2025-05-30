// Direct patch for the image-size module's file reading functionality
const Module = require('module');
const originalRequire = Module.prototype.require;
const fs = require('fs');
const path = require('path');

// Override the require function to intercept image-size module
Module.prototype.require = function patchedRequire(id) {
  // First, get the original module
  let originalModule = originalRequire.apply(this, arguments);
  
  // Only patch the image-size module
  if (id === 'image-size' || id.includes('image-size')) {
    // Keep a reference to the original functions
    const originalImageSize = originalModule.imageSize || originalModule;
    
    // Create our patched version of the module
    const patchedImageSize = function patchedImageSize(...args) {
      // Handle direct ArrayBuffer input
      if (args[0] instanceof ArrayBuffer) {
        args[0] = Buffer.from(new Uint8Array(args[0]));
      }
      return originalImageSize.apply(this, args);
    };
    
    // Patch the internal readFileSync function if it exists
    if (originalModule.readFileSync) {
      const originalReadFileSync = originalModule.readFileSync;
      originalModule.readFileSync = function patchedReadFileSync(...args) {
        const result = originalReadFileSync.apply(this, args);
        if (result instanceof ArrayBuffer) {
          return Buffer.from(new Uint8Array(result));
        }
        return result;
      };
    }
    
    // Patch the internal readFile function if it exists
    if (originalModule.readFile) {
      const originalReadFile = originalModule.readFile;
      originalModule.readFile = function patchedReadFile(...args) {
        return originalReadFile.apply(this, args).then(result => {
          if (result instanceof ArrayBuffer) {
            return Buffer.from(new Uint8Array(result));
          }
          return result;
        });
      };
    }
    
    // Copy all properties from the original function to our patched version
    for (const key in originalImageSize) {
      if (Object.prototype.hasOwnProperty.call(originalImageSize, key)) {
        patchedImageSize[key] = originalImageSize[key];
      }
    }
    
    // Replace the module or return our patched version
    if (originalModule.imageSize) {
      originalModule.imageSize = patchedImageSize;
      return originalModule;
    } else {
      return patchedImageSize;
    }
  }
  
  return originalModule;
};

console.log('✅ Applied direct image-size module patch');