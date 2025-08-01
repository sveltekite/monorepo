# Super Components

## A pattern for tidy, scalable Svelte apps.

Super Components provide a predictable and systemised way to organise data loading, and have been designed to work with Svelte's new remote functions [(as of SvelteKit 2.27)](https://svelte.dev/docs/kit/remote-functions).

Super Components provide the following benefits:

- All data loading queries are centralised and batched at the top level of a component hierarchy
- Data is passed to sub components via props
- Errors are automatically handled and passed to dedicated components
- Components can be reused across multiple contexts, with different data passed to them

Using Super Components, the majority of your other components can follow the exact same pattern: receive relevant data as props, import a mutation function, and then provide the form or interface required for the mutation.
