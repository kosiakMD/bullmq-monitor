# @bullmq-monitor/ui

Dashboard front-end for [BullMQ Monitor](https://github.com/kosiakMD/bullmq-monitor).

You do not install this package directly. It is built into
`@bullmq-monitor/root`, which serves the assets from your own app.

## Development

```bash
# against a running monitor on http://localhost:3000
npm run dev -w packages/ui

# with mocked data, no redis or server needed
npm run dev-with-mocks -w packages/ui
```

Point the dev server at another API with `VITE_GRAPHQL_URL`.

## Build

```bash
npm run build -w packages/ui        # -> packages/ui/build
npm run build-demo -w packages/ui   # mocked build for GitHub Pages
```

The production build finds its GraphQL endpoint from a
`<meta name="bullmq-monitor:graphql">` tag rendered by the server, so the same
bundle works at any mount path.

## License

MIT
