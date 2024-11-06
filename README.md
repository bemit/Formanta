<p align="center">
  <a href="https://formanta.bemit.codes" rel="noopener noreferrer" target="_blank"><img width="125" src="https://formanta.bemit.codes/formanta_logo.svg" alt="Formanta Logo"></a>
</p>

<h1 align="center">Formanta Monorepo</h1>

Libraries to empower assets related tasks and help to build & style web pages and more.

Only ready package is [`@formanta/sass`](https://github.com/bemit/FormantaSass).

- Formanta
    - @formanta/blocks [![npm (scoped)](https://img.shields.io/npm/v/@formanta/blocks?style=flat-square)](https://www.npmjs.com/package/@formanta/blocks)
    - @formanta/sass [![npm (scoped)](https://img.shields.io/npm/v/@formanta/sass?style=flat-square)](https://www.npmjs.com/package/@formanta/sass)

## Dev Notes

Git clone, incl. submodules, then setup:

```shell
npm i
```

Update packages:

```shell
npm run clean && rm -rf node_modules && npm i
```

Start demo:

```shell
npm start
```

Build:

```shell
# FormantaSass demo + docs:
npm run build

# only build FormantaSass docs:
npm run build-docs
```

## License

This project is free software distributed under the **MIT License**.

See: [LICENSE](LICENSE).

© 2015 - 2024 [Michael Becker](https://i-am-digital.eu), bemit UG (haftungsbeschränkt)
