# SvelteKite Design

## Considerations

1. Since lists should just have data, not instances, perhaps the [table] route should just import the ListItem component and pass data to it, without instantiating each item.

2. We need a default component for each with* function:
   - `detail` for `withSave`
   - `listItem` for `withProps` (we can just pass data to this! - Actually we still need Instance for [table] route)
   - `author` for `withInstance` to load an instance of relational data
   - `selectTags` for `withData` to load a list of data

## Generated Components

For every table:
   - Detail - receives instance
   - ListItem - receives instance

For every relation:
   - Select - receives data

For every many-to-many relation:
   - List - receives data (and remove callback, currently)
   - Delete - receives remove callback - currently passes through list :(
