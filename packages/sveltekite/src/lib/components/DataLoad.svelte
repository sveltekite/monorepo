<script lang="ts">
   // @ts-nocheck (error 2353 on pending snippet)
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
