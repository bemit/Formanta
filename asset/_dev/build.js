import run from './run';

async function clean() {
    // TODO: Clean the output folder
}

async function copy() {
    // TODO: Copy static files
}

async function bundle() {
    // TODO: Bundle JavaScript and CSS code
}

async function build() {
    await run(clean);
    await run(copy);
    await run(bundle);
}

export default build;