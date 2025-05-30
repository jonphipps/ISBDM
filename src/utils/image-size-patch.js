// Patch specifically for image-size module
const Module = require('module');
const originalRequire = Module.prototype.require;
const fs = require('fs');
const originalFsRead = fs.read;

// Patch the fs.read function
fs.read = function patchedFsRead(fd, buffer, offset, length, position, callback) {
  // If buffer is an ArrayBuffer, convert it to a Buffer
  if (buffer instanceof ArrayBuffer) {
    buffer = Buffer.from(buffer);
  }
  
  // Call the original fs.read with the converted buffer
  return originalFsRead.call(this, fd, buffer, offset, length, position, callback);
};

// Override the require function to intercept image-size module
Module.prototype.require = function patchedRequire(id) {
  // Call original require first
  const originalModule = originalRequire.apply(this, arguments);
  
  // Only patch the image-size module
  if (id === 'image-size' || id.includes('image-size')) {
    const originalSizeOf = originalModule.imageSize || originalModule;
    
    // Create a wrapper function that handles ArrayBuffer conversions
    const patchedSizeOf = function(...args) {
      // If the first argument is an ArrayBuffer, convert it to Buffer
      if (args[0] instanceof ArrayBuffer) {
        args[0] = Buffer.from(args[0]);
      }
      return originalSizeOf.apply(this, args);
    };
    
    // Copy over all properties and methods from the original
    for (const prop in originalSizeOf) {
      if (Object.prototype.hasOwnProperty.call(originalSizeOf, prop)) {
        patchedSizeOf[prop] = originalSizeOf[prop];
      }
    }
    
    // Replace the original module with our patched version
    if (originalModule.imageSize) {
      originalModule.imageSize = patchedSizeOf;
    } else {
      return patchedSizeOf;
    }
  }
  
  return originalModule;
};

console.log('✅ Applied image-size module patch with fs.read override');