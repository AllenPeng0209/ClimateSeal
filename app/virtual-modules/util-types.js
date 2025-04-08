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

export function isTypedArray(value) {
  return ArrayBuffer.isView(value) && !(value instanceof DataView);
}

export function isDataView(value) {
  return value instanceof DataView;
}

export function isWeakMap(value) {
  return value instanceof WeakMap;
}

export function isWeakSet(value) {
  return value instanceof WeakSet;
}

export function isPromise(value) {
  return value instanceof Promise;
}

export function isGenerator(value) {
  return value && typeof value.next === 'function' && typeof value.throw === 'function';
}

export function isGeneratorFunction(value) {
  return value && value.constructor && value.constructor.name === 'GeneratorFunction';
}

export function isAsyncFunction(value) {
  return value && value.constructor && value.constructor.name === 'AsyncFunction';
}

export function isAsyncGenerator(value) {
  return value && typeof value.next === 'function' && typeof value.throw === 'function' && value[Symbol.asyncIterator];
}

export function isAsyncGeneratorFunction(value) {
  return value && value.constructor && value.constructor.name === 'AsyncGeneratorFunction';
}

export function isBigInt(value) {
  return typeof value === 'bigint';
}

export function isBigInt64Array(value) {
  return value instanceof BigInt64Array;
}

export function isBigUint64Array(value) {
  return value instanceof BigUint64Array;
}

export function isFloat32Array(value) {
  return value instanceof Float32Array;
}

export function isFloat64Array(value) {
  return value instanceof Float64Array;
}

export function isInt8Array(value) {
  return value instanceof Int8Array;
}

export function isInt16Array(value) {
  return value instanceof Int16Array;
}

export function isInt32Array(value) {
  return value instanceof Int32Array;
}

export function isUint8ClampedArray(value) {
  return value instanceof Uint8ClampedArray;
}

export function isUint16Array(value) {
  return value instanceof Uint16Array;
}

export function isUint32Array(value) {
  return value instanceof Uint32Array;
}

export default {
  isArrayBuffer,
  isArrayBufferView,
  isDate,
  isRegExp,
  isMap,
  isSet,
  isUint8Array,
  isAnyArrayBuffer,
  isTypedArray,
  isDataView,
  isWeakMap,
  isWeakSet,
  isPromise,
  isGenerator,
  isGeneratorFunction,
  isAsyncFunction,
  isAsyncGenerator,
  isAsyncGeneratorFunction,
  isBigInt,
  isBigInt64Array,
  isBigUint64Array,
  isFloat32Array,
  isFloat64Array,
  isInt8Array,
  isInt16Array,
  isInt32Array,
  isUint8ClampedArray,
  isUint16Array,
  isUint32Array
}; 