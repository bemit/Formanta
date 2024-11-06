# Formanta Blocks

Opinionated, simplistic flat-file static-side generator.

> Playing around with some liquid and module graph bundler things.

## Modules

### Pages

For each file in `/templates/pages` an HTML file is generated.

#### Data Files

Optionally define data files for each page in `/data`, once a file matches to the page files base name it is used.

Uses the first found file with the extensions: `yaml, yml, json`.

Add the `_globals` file to define default values, where page data is recursively merged into. Note that an array in page data overwrites default arrays and are not combined.

#### Collections

> *todo*

- use one data file for the collection, with an array of elements
- name like the folder name of the collection file and the attributes
    - to be able to also add a e.g. `blog.json` with `blog.liquid` as overview page
- attributes per entry are added to file name

```
# Data File ideas
# when used as collection, this would not allow collections with suffixes
/data/blog.[slug].json
# a bit more overhead, but the safest option
/data/blog/[slug].json

# Template Files
/templates/pages/blog/[slug].liquid
/templates/pages/blog.[slug].liquid
/templates/pages/blog.liquid
```

### Styles

Stylesheets are automatically detected in the `styles` folder, any `.scss|sass` file without a leading underscore is treated as an entrypoint.

Their name must be used to reference them from within templates, for the file `/styles/main.scss` get its path with:

```html

<link rel="stylesheet" href="{{ assets.styles['main.scss'] }}"/>
```

> Not possible due to liquid limitations:
> ~~Based on the `link` tags for each page, the needed Sass files are generated and a link to them is injected.~~

### JavaScript

For JS no automatic entrypoint detection is possible, the files for dev-serving often are dynamic and only known once build, making lazy injection very hard - without full-blown HMR support.

> nothing included

## Conceptual Serve Flow

> This was written while trying to get relative imports of assets working, incl. their lazy serving and back-injection,
> which isn't possible as liquid does not provide a way to know where which HTML is produced.
> Could this be implemented with custom `layout`/`include` tags etc. and per-render Drops to collect usages?
> The source of the layout tag impl. looks like "a block is rendered in the layout", be sure that this is possible when going for blocks to know from which file they come from.

Must allow:

- full in memory serving, without spilling anything to disk
- refresh browser on changes (not HMR)
- know dependencies for entrypoints and only invalidate and refresh affected dependants
    - where possible, e.g. liquid doesn't offer an interface for it
- clean caches and lazily render and compile assets only when used

Flow:

- build assets index
    - all page "entry points"
    - all style "entry points" - only for distributed files / build not serve
- register routes for style, for lazy style compiling
    - or a standard `/@assets` folder, which looks up based on absolute file path
- register routes for pages, for lazy page rendering

- page rendering
- lookup data file(s)
- run renderer
- liquid rendering
- parse5 extract assets references
- get asset references
- inject back
- minify html (incl. js, css)

- collection rendering
- load collection data
- ...
