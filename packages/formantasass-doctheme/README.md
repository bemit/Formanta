# SassDoc Default Theme

This is [SassDoc](https://github.com/SassDoc/sassdoc)'s default theme which means this is the theme that will be used when running SassDoc without a custom theme.

This theme uses [Themeleon](https://github.com/themeleon/themeleon) as a theme engine, and [themeleon-swig](https://github.com/themeleon/themeleon-swig) as a template engine, directly plugged into Themeleon.

Because this is likely to be the most used theme of all, it is not as simple as a theme can get. For instance, there is quite a bit of logic in both `index.js` and the Swig templates. Fortunately, you don't have to deal with that at all.

## Customising the view

There are some possibilites to customise the theme's view. Essentially what's being displayed, what's not, and what are the project informations to be displayed in the header and footer.

To learn how to customise the theme's view, please read [the documentation on SassDoc's site](http://sassdoc.com/customising-the-view/). Fear not! It's all about creating a configuration file. No big deal.

## Notes

> For this local fork.

### Dependencies

Removed the `devDependencies`, as never used built locally:

```json
{
    "devDependencies": {
        "babel-cli": "^6.22.2",
        "babel-plugin-transform-runtime": "^6.22.0",
        "babel-preset-latest": "^6.22.0",
        "standard": "^8.6.0",
        "uglify-js": "^2.4.15"
    }
}
```
