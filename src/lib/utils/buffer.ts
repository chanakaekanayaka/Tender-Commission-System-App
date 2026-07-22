/** Response's BodyInit doesn't accept Node's Buffer directly under this TS config — copy out the
 *  underlying bytes into a real ArrayBuffer instead. Used by every route that streams a
 *  server-generated file (PDF/Excel) back as the HTTP response body. */
export function toArrayBuffer(buffer: Buffer): ArrayBuffer {
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
}
