# Website

This website is built using [Docusaurus](https://docusaurus.io/), a modern static website generator.

## Important Notes

- We use traditional `node_modules` mode with Yarn Berry instead of PnP mode due to compatibility issues with the `image-size` module. See [IMAGE-SIZE-FIX.md](./IMAGE-SIZE-FIX.md) for details.
- Global configuration for components is stored in `customFields` in `docusaurus.config.ts`. This includes defaults for:
  - `vocabularyDefaults`: Common properties for vocabulary tables (prefix, startCounter, etc.)
  - See documentation in `docs/examples/` for usage details.

## Project Structure

- `ISBDM/` - Original HTML source that we're converting to Docusaurus. Use this folder as a reference when you need to know something about the original content.
- `docs/` - Documentation content in MDX format (converted from the original HTML).

### Installation

```
$ yarn
```

### Local Development

```
$ yarn start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

### Build

```
$ yarn build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

### Deployment

Using SSH:

```
$ USE_SSH=true yarn deploy
```

Not using SSH:

```
$ GIT_USER=<Your GitHub username> yarn deploy
```

If you are using GitHub pages for hosting, this command is a convenient way to build the website and push to the `gh-pages` branch.
