<script lang="ts">
   // @ts-nocheck
   let { loader, children } = $props()
</script>

<svelte:boundary>
   {@render children(await loader())}

   {#snippet pending()}
      Loading...
   {/snippet}

   {#snippet failed(error, reset)}
      Something went wrong! {error}
   {/snippet}
</svelte:boundary>
