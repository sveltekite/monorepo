<script lang="ts">
   // @ts-nocheck
   import { type __CLASS_NAME__ } from '$lib/generated/classes/__CLASS_NAME__.svelte.js'

   let { __ENTITY_NAME__ }: { __ENTITY_NAME__: __CLASS_NAME__ } = $props()

   function handleDelete() {
      if (confirm('Are you sure you want to delete this __ENTITY_DISPLAY_NAME__?')) {
         __ENTITY_NAME__.delete()
      }
   }
</script>

<button onclick={handleDelete} class="delete-button">
   Delete __ENTITY_DISPLAY_NAME__
</button>

<style>
   .delete-button {
      background-color: #dc3545;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 0.25rem;
      cursor: pointer;
   }

   .delete-button:hover {
      background-color: #c82333;
   }
</style>
