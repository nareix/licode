#!/usr/bin/env bash

set -e

SCRIPT=`pwd`/$0
FILENAME=`basename $SCRIPT`
PATHNAME=`dirname $SCRIPT`
ROOT=$PATHNAME/..
CURRENT_DIR=`pwd`

export PATH=../build/libdeps/nvm/versions/node/v6.9.2/bin/:$PATH
export ERIZO_HOME=$ROOT/erizo

if hash node-waf 2>/dev/null; then
  echo 'building with node-waf'
  rm -rf build
  node-waf configure build
else
  echo 'building with node-gyp'
  #node-gyp rebuild
  node-gyp build
fi
