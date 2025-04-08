/**
 * 提供node:util/types模塊的替代實現
 */

export function isArrayBuffer(value) {
  return value instanceof ArrayBuffer;
}

export function isArrayBufferView(value) {
  return ArrayBuffer.isView(value);
}

export function isDate(value) {
  return value instanceof Date;
}

export function isRegExp(value) {
  return value instanceof RegExp;
}

export function isMap(value) {
  return value instanceof Map;
}

export function isSet(value) {
  return value instanceof Set;
}

export function isUint8Array(value) {
  return value instanceof Uint8Array;
}

export function isAnyArrayBuffer(value) {
  return value instanceof ArrayBuffer || (typeof SharedArrayBuffer !== 'undefined' && value instanceof SharedArrayBuffer);
}

export default {
  isArrayBuffer,
  isArrayBufferView,
  isDate,
  isRegExp,
  isMap,
  isSet,
  isUint8Array,
  isAnyArrayBuffer
}; 