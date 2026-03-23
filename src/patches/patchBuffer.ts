// Patch for Node.js v25+ which removed SlowBuffer
// This must be imported BEFORE jsonwebtoken
import { Buffer } from "buffer";

if (!(globalThis as any).SlowBuffer) {
  (globalThis as any).SlowBuffer = Buffer;
}

// Also patch require('buffer').SlowBuffer if missing
const bufferModule = require("buffer");
if (!bufferModule.SlowBuffer) {
  bufferModule.SlowBuffer = Buffer;
}
