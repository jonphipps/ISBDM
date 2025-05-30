// Direct patch for the FileHandle.read method in fs.promises
const fs = require('fs');

if (!fs.promises || !fs.promises.FileHandle) {
  console.log('⚠️ FileHandle patch not applicable - fs.promises.FileHandle not found');
} else {
  const FileHandle = fs.promises.FileHandle;
  const originalRead = FileHandle.prototype.read;

  // Replace the FileHandle.read method with our patched version
  FileHandle.prototype.read = async function patchedRead(buffer, offset, length, position) {
    // Check if buffer is an ArrayBuffer and convert it to Buffer if needed
    if (buffer instanceof ArrayBuffer) {
      try {
        buffer = Buffer.from(buffer);
        console.log('✅ Successfully converted ArrayBuffer to Buffer in FileHandle.read');
      } catch (err) {
        console.error('❌ Error converting ArrayBuffer to Buffer:', err);
        // Fallback conversion
        buffer = Buffer.from(new Uint8Array(buffer));
      }
    }
    
    // Call the original read method with the converted buffer
    return originalRead.call(this, buffer, offset, length, position);
  };

  console.log('✅ Applied FileHandle.read patch for ArrayBuffer conversion');
}