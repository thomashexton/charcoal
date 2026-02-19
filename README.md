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
| `gt dash` command | Opens Graphite web dashboard (Charcoal has its own configurable `gt dash`) |
| `gt guide` command | Interactive tutorials not ported |

### Additional Charcoal Features

| Feature | Description |
|---------|-------------|
| `gt dash` | Open a user-configured dashboard URL in the browser. Set the URL with `gt config dash-url --set <url>`. |
| `gt trunk --remove <branch>` | CLI equivalent of Graphite's interactive "Remove configured trunk" menu option |
| `gt undo --list` | View operation history without undoing |
| `gt undo` | Reflog-based undo with annotated operation history (**experimental**) |

## Configuration

Charcoal supports user-level configuration via `gt config` commands. Configuration is stored in `~/.graphite_user_config`.

### Out-of-Sync Trunk Behavior

Control what happens when your local trunk is out of sync with the remote during `gt submit`:

```bash
# Set default behavior
gt config ignore-out-of-sync-trunk --set <prompt|ignore|warn>

# View current setting
gt config ignore-out-of-sync-trunk
```

**Behavior modes:**
- `prompt` (default) - Ask for confirmation in interactive mode, error in non-interactive mode
- `ignore` - Skip the out-of-sync check entirely (no warning, no prompt)
- `warn` - Show warning but proceed anyway (non-blocking)

**Precedence:** CLI flag > Environment variable > User config > Default

```bash
# One-time override via environment variable
GT_IGNORE_OUT_OF_SYNC_TRUNK=ignore gt submit

# One-time override via CLI flag
gt submit --ignore-out-of-sync-trunk
```

**Examples:**

```bash
# Set default to skip the check
gt config ignore-out-of-sync-trunk --set ignore

# Set default to warn but proceed
gt config ignore-out-of-sync-trunk --set warn

# Reset to default (prompt)
gt config ignore-out-of-sync-trunk --unset
```

### Known Differences

| Feature | Graphite | Charcoal |
|---------|----------|----------|
| `gt undo` | Full operation log with inverse operations | Reflog-based: records operations with commit SHAs and cross-references the git reflog (**experimental**) |
| `gt config` | Interactive TUI menu | Simple `gt config <key> <value>` CLI |

### Undo (experimental)

`gt undo` uses a reflog-based approach to let you revert Charcoal operations:

- **Operation logging**: All mutating commands (`create`, `delete`, `rename`, `fold`, `split`, `squash`, `amend`, `commit`, `edit`, `move`, and `undo` itself) record the HEAD commit SHA before and after the operation.
- **Annotated reflog**: `gt undo` displays the git reflog with annotations showing which entries correspond to known Charcoal operations, making it easier to find the right point to reset to. The reflog automatically expands to cover all displayed operations.
- **Undo suggestions**: For each recorded operation, `gt undo` suggests the exact `git reset --hard` command to reverse it.
- **Undo is (maybe) undoable**: `gt undo` logs itself, so you can undo an undo, maybe.
- **History depth**: By default `gt undo` shows the last 5 operations. Use `-n` to go further back (e.g. `gt undo -n 20`). Use `gt undo --list` to view operations without the undo prompt.

⚠️ **Caveats**:
- Undo uses `git reset --hard`, which moves HEAD and discards working tree changes.
- Branch metadata (`refs/branch-metadata/`) is stored as independent git refs and is **not** affected by reset. After undoing, metadata may be out of sync — run `gt init` to rebuild it.
- This is not a full inverse-operation system; it resets git state via the reflog.

## Deprecated Commands

Charcoal has moved to a flattened command structure. Old nested commands like `gt branch create`, `gt stack submit`, etc. are no longer supported.

Running a deprecated command will print the new command to use and exit with an error.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md)
