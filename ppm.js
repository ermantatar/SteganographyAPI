#!/usr/bin/env nodejs

'use strict';

const TextDecoder = require('util').TextDecoder;
const assert = require('assert');

/** This constructor must be called with 2 arguments.  The first
 *  argument must be an id string specifying the id property of the
 *  return'd object.  The second argument must be either an existing
 *  Ppm object ppm or a UInt8Array bytes.  If the second argument is
 *  an existing ppm object, then it returns a deep copy of that object
 *  which is the same except for the id property which is set to the
 *  first id argument.  If the second argument is a Uint8Array bytes
 *  then PPM meta and data information is extracted into the
 *  constructed object.
 *
 *  It is assumed that bytes contains all the bytes of a P6 PPM image,
 *  including meta-information.  Specifically, bytes should be in the
 *  following format:
 *
 *     1.  A 2-byte "magic number", specifying the format.  Only legal values
 *         for this project are "P6" (in ASCII).
 *     2.  One of more whitespace characters as defined by the isspace()
 *         function from <ctype.h>
 *     3.  A positive ASCII integer giving the width X of the image in pixels.
 *     4.  Whitespace as above.
 *     5.  A positive ASCII integer giving the height Y of the image in pixels.
 *     6.  Whitespace as above.
 *     7.  A positive ASCII integer giving the maximum color value of each
 *         pixel.  For this project, this value should always be 255.
 *     8.  A single whitespace character.
 *     9.  The data for the pixels in the image.  Since each pixel is
 *         represented by 3 RGB color values, the pixel data must have
 *         exactly 3*X*Y bytes.
 * 
 * If there is an error, then the object return'd will have errorCode
 * and message properties set to values.  If everything is ok,
 * then the return'd object contains the following fields:
 * 
 *    width:       The width of the image.
 *    height:      The height of the image.
 *    maxNColors:  The max # of colors in the image.
 *    nHeaderBytes:# of prefix bytes in bytes[] which contain
 *                 header information.
 *    bytes:       A Uint8Array giving the bytes constituting the
 *                 image.
 */
function Ppm(...args) {
  assert.equal(args.length, 2, "Ppm(): call as Ppm(id, bytes) or Ppm(id, ppm)");
  assert.equal(typeof args[0], 'string', "Ppm(): 1'st arg must be a id string");
  assert.equal(typeof args[1], 'object',
	       "Ppm(): 2'nd arg must be an existing Ppm object or Uint8Array");
  assert(args[1].constructor === Ppm || args[1].constructor === Uint8Array,
	 "Ppm(): 2'nd arg must be an existing Ppm object or Uint8Array");
  const id = args[0];
  if (args[1].constructor === Ppm) { //copy constructor
    const ppm = arg;
    Object.assign(this, ppm);
    this.id = id;
    this.bytes = this.bytes.slice();
  }
  else { //constructing new Ppm from Uint8Array
    const bytes = args[1];
    const format = ppmFormat(bytes);
    if (!format) {
      return { errorCode: 'BAD_FORMAT', message: 'bad image format' }
    }
    else {
      Object.assign(this, format);
      this.id = id;
      this.bytes = bytes.slice();
    }
  }
  return Object.freeze(this);
}

Ppm.prototype.toString = function() {
  return `ppm '${this.id}': ${this.width}x${this.height}`
}

const PPM_FORMAT = 'P6';

/** If bytes constitute a valid PPM image, then return an object
 *  giving its width, height, maxNColors image parameters.  Additionally,
 *  it will also contain a nHeaderBytes property giving the start of
 *  the image pixel data in bytes.  
 *
 *  If bytes does not constitute a valid PPM image, return undefined.
 */
function ppmFormat(bytes) {
  const bufIndex = new BufIndex(bytes);
  const c0 = bufIndex.nextChar(), c1 = bufIndex.nextChar();
  if (c0 !== PPM_FORMAT[0] && c1 !== PPM_FORMAT[1]) return undefined;
  const width = bufIndex.nextInt();
  const height = bufIndex.nextInt();
  const maxNColors = bufIndex.nextInt();
  const nHeaderBytes = bufIndex.index + 1;
  if (width > 0 && height > 0 && maxNColors === 255 &&
      bytes.length === nHeaderBytes + width*height*3) {
    return {
      width: width,
      height: height,
      maxNColors: maxNColors,
      nHeaderBytes: nHeaderBytes
    };
  }
  else {
    return undefined;
  }
}

/** An object which tracks a byte buffer and index. */
function BufIndex(buf, index=0) {
  this.buf = buf;
  this.index = index;
}

/** Return the next character from buffer; update index. 
 *  Return undefined on error.
 */
BufIndex.prototype.nextChar = function() {
  const buf = this.buf, i = this.index;
  return i < buf.length ? String.fromCharCode(buf[this.index++]) : undefined;
}

/** Return the next non-negative integer read from buffer at the
 *  current index, updating index. Ignore whitespace before the
 *  integer digits.  Return undefined on error.
 */
BufIndex.prototype.nextInt = function() {
  const nextIndex = advanceOverNextInt(this.buf, this.index);
  if (nextIndex > 0) {
    const str = new TextDecoder().decode(this.buf.slice(this.index, nextIndex));
    this.index = nextIndex;
    return Number(str);
  }
  else {
    return undefined;
  }
}
  

/** Starting at buf[index] advance index over a sequence of whitespace
 *  followed by a sequence of digits.  Return index just past the digits.
 *  Return -1 if sequence of digits is not found.
 */
function advanceOverNextInt(buf, index) {
  while (index < buf.length && isspace(buf[index])) index++;
  if (index >= buf.length || !isdigit(buf[index])) return -1;
  while (index < buf.length && isdigit(buf[index])) index++;
  return index;
}

/** An object which maps whitespace character codes to 'space',
 *  digit character codes to 'digit', all others to undefined.
 */
const CTYPES = new function() {
  for (const c of ' \t\n\r') { this[c.charCodeAt()] = 'space'; }
  for (const c of '0123456789') { this[c.charCodeAt()] = 'digit'; }
}

function isspace(byte) {
  return CTYPES[byte] === 'space';
}

function isdigit(byte) {
  return CTYPES[byte] === 'digit';
}


module.exports = Ppm;
