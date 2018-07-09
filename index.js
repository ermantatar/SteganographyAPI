#!/usr/bin/env nodejs

'use strict';

const assert = require('assert');
const path = require('path');
const process = require('process');

const services = require('./steg-ws');
const imgStore = require('img-store');

function usage() {
  console.error(`usage: ${process.argv[1]} PORT IMG_PATH...`);
  process.exit(1);
}

function getPort(portArg) {
  let port = Number(portArg);
  if (!port) usage();
  return port;
}

async function preloadImages(images, argPaths) {
  for (const argPath of argPaths) {
    const group = argPath.match(/\/([^\/]+)\/[^\/]+$/)[1] || 'inputs';
    const id = await images.put(group, argPath);
    console.log(`${path.basename(argPath)}: ${group}/${id}`);
  }
}

const BASE = '/api';

async function go(args) {
  try {
    const port = getPort(args[0]);
    const images = await imgStore();
    await preloadImages(images, args.slice(1));
    services.serve(port, BASE, images);
  }
  catch (err) {
    console.error(err);
  }
}
    

if (process.argv.length < 3) usage();
go(process.argv.slice(2));
