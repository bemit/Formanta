/**
 * @type {LoadEnv}
 */
const LoadEnv = require('../LoadEnv');

const fs = require('fs');
const path = require('path');
const colors = require('colors/safe');

/**
 * @type {HandlerBase}
 */
const HandlerBase = require('./HandlerBase');

/**
 * @type {Runner}
 */
const Runner = require('../Runner');

class HandleSVG extends HandlerBase {
    run() {
        // inline handle dependency load for using `option` provided by FIRST handler for setup `svgo`
        const svgo = LoadEnv.load('svgo', (SVGO) => {
            // will run only on first load
            return new SVGO({
                plugins: [
                    {cleanupAttrs: true,},
                    /*{removeDoctype: true,},
                    {removeXMLProcInst: true,},
                    {removeComments: true,},*/
                    {removeMetadata: true,},
                    /*{removeTitle: true},
                    {removeDesc: true},*/
                    {removeUselessDefs: true,},
                    {removeEditorsNSData: true,},
                    {removeEmptyAttrs: true},
                    /*{removeHiddenElems: true},
                    {removeEmptyText: true},
                    {removeEmptyContainers: true,},*/

                    // @example for using option
                    {removeViewBox: this.option.removeViewBox,},
                    /*{cleanupEnableBackground: true,},
                    {convertStyleToAttrs: true,},
                    {convertColors: true,},
                    {convertPathData: true,},
                    {convertTransform: true,},*/
                    {removeUnknownsAndDefaults: true,},
                    {removeNonInheritableGroupAttrs: true,},
                    {removeUselessStrokeAndFill: true,},
                    {removeUnusedNS: true,},
                    {cleanupIDs: true,},
                    /*{cleanupNumericValues: true,},
                    {moveElemsAttrsToGroup: true,},
                    {moveGroupAttrsToElems: true,},
                    {collapseGroups: true,},
                    {removeRasterImages: false,},
                    {mergePaths: true,},
                    {convertShapeToPath: true,},
                    {sortAttrs: true,},
                    {removeDimensions: true,},
                    {
                        removeAttrs:
                            {attrs: '(stroke|fill)'},
                    }*/
                ]
            });
        });

        return super.run_internal((on_finish => {
            fs.readFile(this.src, 'utf8', (err, data) => {
                // read svg
                if(err) {
                    throw err;
                }
                //optimize svg
                svgo.optimize(data, {path: this.src}).then((result) => {
                    // SVG data string
                    // result.data
                    // Info like width, height
                    // result.info

                    // write svg and finish
                    fs.writeFile(this.dist, result.data, on_finish);
                });
            });
        }));
    }
}

/**
 *
 * @type {HandleSVG}
 */
module.exports = HandleSVG;