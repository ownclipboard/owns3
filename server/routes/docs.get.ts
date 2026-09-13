/** API reference rendered with Scalar, using the public spec at /api/v1/openapi.json. */
export default defineEventHandler((event) => {
  setResponseHeader(event, 'content-type', 'text/html; charset=utf-8')
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Owns3 API Reference</title>
    <link rel="icon" type="image/svg+xml" href="/logos/app-icon.svg" />
    <link rel="icon" type="image/png" sizes="32x32" href="/logos/favicon-32.png" />
  </head>
  <body>
    <script id="api-reference" data-url="/api/v1/openapi.json"></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>`
})
