<p align="center">
  <a href="https://formanta.bemit.codes" rel="noopener noreferrer" target="_blank"><img width="125" src="https://formanta.bemit.codes/formanta_logo.svg" alt="Formanta Logo"></a>
</p>

<h1 align="center">Formanta Monorepo</h1>

Libraries to empower assets related tasks and help to build & style web pages and more.

- @formanta/blocks [![npm (scoped)](https://img.shields.io/npm/v/@formanta/blocks?style=flat-square)](https://www.npmjs.com/package/@formanta/blocks)
- @formanta/sass [![npm (scoped)](https://img.shields.io/npm/v/@formanta/sass?style=flat-square)](https://www.npmjs.com/package/@formanta/sass)

## Dev Notes

Git clone, incl. submodules, then setup:

```shell
npm i
```

Start sass demo:

```shell
npm run demo
```

Start blocks demo:

```shell
npm run demo-blocks
```

Build:

```shell
# FormantaSass demo + docs:
npm run build

# only build FormantaSass docs:
npm run build-docs
```

Build misc. assets, requires build output:

```shell
lerna run --stream screenshots
lerna run --stream favicons
```

Update packages:

```shell
npm run clean && rm -rf node_modules && rm package-lock.json && npm i
```

## License

This project is free software distributed under the **MIT License**.

See: [LICENSE](LICENSE).

© 2015 - 2024 [Michael Becker](https://i-am-digital.eu), bemit UG (haftungsbeschränkt)
