// More comprehensive patch to fix ArrayBuffer to Buffer conversion issues
const fs = require('fs');
const originalRead = fs.read;
const util = require('util');
const originalBufferFrom = Buffer.from;

// Enhance Buffer.from to better handle ArrayBuffers
Buffer.from = function enhancedBufferFrom(...args) {
  if (args.length > 0 && args[0] instanceof ArrayBuffer) {
    try {
      // Try the standard approach first
      return originalBufferFrom.apply(this, args);
    } catch (e) {
      console.log('⚠️ Using fallback ArrayBuffer conversion');
      // Fallback: Convert ArrayBuffer to TypedArray first
      return originalBufferFrom(new Uint8Array(args[0]));
    }
  }
  return originalBufferFrom.apply(this, args);
};

// Patch fs.read to handle ArrayBuffer inputs
fs.read = function patchedRead(fd, buffer, offset, length, position, callback) {
  // Convert ArrayBuffer to Buffer if needed
  if (buffer instanceof ArrayBuffer) {
    buffer = Buffer.from(buffer);
  }
  return originalRead.call(this, fd, buffer, offset, length, position, callback);
};

// Monkey patch the FileHandle.read method that's used by image-size
const originalFsPromises = fs.promises;
if (originalFsPromises && originalFsPromises.FileHandle) {
  const originalFileHandleRead = originalFsPromises.FileHandle.prototype.read;

  if (originalFileHandleRead) {
    originalFsPromises.FileHandle.prototype.read = async function patchedFileHandleRead(buffer, offset, length, position) {
      // Convert ArrayBuffer to Buffer if needed
      if (buffer instanceof ArrayBuffer) {
        buffer = Buffer.from(buffer);
      }
      return originalFileHandleRead.call(this, buffer, offset, length, position);
    };
  }
}

console.log('✅ Applied comprehensive Buffer and fs.read patch');