<script lang="ts">
   import { getContext, type Component } from 'svelte'

   let { contextKey, keys, Child }: { contextKey: string, keys: string[], Child: Component<any>} = $props()

   const context: { getData: (key: string) => any } = getContext(contextKey)
   const data = $derived(keys.reduce((obj, k) => ({...obj, [k]: context.getData(k)}), {}))
</script>

<Child {...data} />
