<script lang="ts">
   import '../app.css'

   let { children } = $props()
</script>
<nav>
   <a href="/">Home</a>
</nav>

<svelte:boundary>
   {@render children?.()}

   {#snippet pending()}
      Loading data...
   {/snippet}

   {#snippet failed(error, reset)}
      <p>Sorry, an error occurred: {(error as Error)?.message ?? error}</p>
   {/snippet}
</svelte:boundary>
