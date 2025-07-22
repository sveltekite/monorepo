<script lang="ts">
   import { type Snippet } from 'svelte'

   let { saver, children, ...restProps }: { saver: Function, children: Snippet<[any]>} = $props()

   $effect(() => {
      try {
         saver()
      } catch(err) {
         console.error("Save failed", err)
      }
   })
</script>

<svelte:boundary>
   {@render children(restProps)}

   {#snippet pending()}
      Loading...
   {/snippet}

   {#snippet failed(error, reset)}
      Something went wrong! {error}
   {/snippet}
</svelte:boundary>
