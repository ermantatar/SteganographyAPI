'use strict';

const newImgStore = require('./img-store');

const fs = require('fs');
const path = require('path');
const {promisify} = require('util');

async function main(argv) {
  if (argv.length < 3 || !COMMANDS[argv[2]] ||
      3 + COMMANDS[argv[2]].args.length != argv.length) {
    usage(argv);
  }
  const cmd = argv[2], args = argv.splice(3);
  let imgStore;
  try {
    imgStore = await newImgStore();
    const result = await imgStore[cmd].apply(imgStore, args);
    COMMANDS[cmd].out.call(null, result);
  }
  catch (err) {
    if (typeof err === 'object' && err.errorCode && err.message) {
      console.error(`${err.errorCode}: ${err.message}`);
    }
    else {
      console.error(err);
    }
  }
  finally {
    if (imgStore) await imgStore.close();
  }
}

module.exports = function () { main(process.argv); }

function outBytes(bytes) {
  process.stdout.write(Buffer.from(bytes));
}

function outList(list) {
  list.forEach((e) => console.log(e));
}

function outMeta(meta) {
  [ 'width', 'height', 'maxNColors', 'nHeaderBytes' ]
    .forEach((e) => console.log(`${e}=${meta[e]}`));
  console.log(`creationTime=${new Date(meta.creationTime).toISOString()}`);
}

function outNop(result) {
}

const COMMANDS = {
  get:  { args: ['GROUP', 'NAME', 'TYPE'], out: outBytes },
  list: { args: ['GROUP'], out: outList },
  meta: { args: ['GROUP', 'NAME'], out: outMeta },
  put:  { args: ['GROUP', 'IMG_PATH'], out: outNop },
};

function usage(argv) {
  const prefix = `usage: ${path.basename(argv[1])} `;
  const msg = prefix +
    Object.keys(COMMANDS).sort().map(function (cmd) {
      return `${cmd} ${COMMANDS[cmd].args.join(' ')}`
    }).join('\n' + ''.padEnd(prefix.length));
  console.error(msg);
  process.exit(1);
}

function error(argv, err) {
  if (err) console.log(err);
  usage(argv);
}


