/*
 * Main Folders used to transpile, optimize, build and so on.
 *
 * ROOT_DIR must be parent of BUILD_DIR and ASSET_DIR, doesn't need to be direct parent, ASSET_DIR can contain BUILD_DIR but BUILD_DIR not ASSET_DIR
 *
 * 1. default assumes formanta.module.asset is installed as dependency of formanta
 * 2. default CI/Bitbucket Pipelines is running formanta.module.asset standalone, setting ROOT_DIR to this dir
 *
 */

// get root dir from env or use default
const ROOT_DIR = (process.env.ROOT_DIR ? (__dirname + process.env.ROOT_DIR) : (__dirname + '/../'));
const ASSET_DIR = (process.env.ASSET_DIR ? (ROOT_DIR + process.env.ASSET_DIR) : ROOT_DIR + 'asset/');
const BUILD_DIR = (process.env.BUILD_DIR ? (ROOT_DIR + process.env.BUILD_DIR) : ROOT_DIR + 'build/');

module.exports = {ROOT_DIR, ASSET_DIR, BUILD_DIR};