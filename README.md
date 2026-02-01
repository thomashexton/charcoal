# Charcoal

> A CLI for managing stacked pull requests

<img width="1346" alt="CleanShot 2023-09-09 at 19 48 49@2x" src="https://github.com/danerwilliams/graphite-cli/assets/22798229/17385828-f235-4b56-84dd-ad73350d55b9">

## Install

`brew install danerwilliams/tap/charcoal`

## Announcement

Check out my blog post announcement [here](https://danewilliams.com/announcing-charcoal) 🙂

## What is Graphite?

From Graphite:

> [Graphite](https://graphite.dev) is a **fast, simple code review platform** designed for engineers who want to **write and review smaller pull requests, stay unblocked, and ship faster**. Anyone can start using Graphite individually without needing their coworkers to change tools - we'll seamlessly sync your code changes and reviews. We built Graphite because we missed internal code review tools like Phabricator (at Facebook) and Critique (Google) that help engineers create, approve, and ship small, incremental changes, and long-term we’re passionate about creating products & workflows that help fast-moving eng teams achieve more.

## What is Charcoal?

Charcoal is simply the Graphite CLI, but open source!

On 7/14/2023 the Graphite team announced that they closed open source development of the Graphite CLI and [moved development to their private monorepo](https://github.com/withgraphite/graphite-cli). They also added a pay wall limiting free users to 10 open stacks at a time per organization starting 8/7/2023.

Graphite is an amazing company and you should absolutely check out their products. In addition to a stacking CLI, they have an entire code review platform, merge queue, and more developer productivity tools.

However, many organizations aren't interested in paying for Graphite's team plan at this time.

The Graphite CLI does not need to depend on Graphite's API, so this project allows for use of the CLI with any git repository (even ones hosted on platforms other than GitHub!), entirely for free.

## User guide

<https://graphite.dev/docs/graphite-cli/>

The Graphite Docs cover most commands available in Charcoal. See the compatibility section below for differences.

## Graphite CLI Compatibility

Charcoal aims to be compatible with the official Graphite CLI. Most commands work identically.

### Fully Compatible Commands

- **Branch creation & modification**: `gt create`, `gt modify`, `gt fold`, `gt split`, `gt squash`, `gt absorb`
- **Navigation**: `gt up`, `gt down`, `gt top`, `gt bottom`, `gt checkout`
- **Stack management**: `gt restack`, `gt move`, `gt reorder`, `gt delete`, `gt rename`
- **Syncing & submission**: `gt submit`, `gt sync`, `gt get`
- **Viewing**: `gt log`, `gt info`
- **Tracking**: `gt track`, `gt untrack`, `gt unlink`
- **Collaboration**: `gt freeze`, `gt unfreeze`
- **Recovery**: `gt undo`, `gt abort`, `gt continue`, `gt pop`
- **Utilities**: `gt init`, `gt auth`, `gt config`, `gt revert`

### Excluded Features

The following Graphite features are intentionally not implemented:

| Feature | Reason |
|---------|--------|
| AI features (`--ai` flags) | Requires Graphite server |
| `gt merge` command | Requires Graphite merge queue |
| `gt guide` command | Interactive tutorials not ported |
| Multiple trunk support (`gt trunk --add`) | Not yet implemented |
| Full remote branch sync in `gt sync` | `sync` pulls trunk and cleans merged branches, but doesn't reconcile remote changes to all local branches |

### Known Differences

| Feature | Graphite | Charcoal |
|---------|----------|----------|
| `gt modify --into` | Amend changes to downstack branch | Not implemented |
| `gt config` | Interactive TUI menu | Simple `gt config <key> <value>` CLI |

## Deprecated Commands

Charcoal has moved to a flattened command structure. Old nested commands like `gt branch create`, `gt stack submit`, etc. are no longer supported.

If you're migrating from an older version and want help finding the new command equivalents, set:

```bash
export GT_CLI_SHOW_DEPRECATION_HELP=1
```

With this enabled, running a deprecated command will show you the new command to use before exiting.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md)
