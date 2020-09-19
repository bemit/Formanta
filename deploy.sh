#!/bin/bash

echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" >.npmrc

echo "Token length: ${#NPM_TOKEN}"

git submodule update --init --recursive

npm ping
#npm run release
#npm run release -- --yes

rm .npmrc
