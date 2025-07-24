<script lang="ts">
   import { type Tag } from '../generated/classes/Tag.svelte.js'

   let { tag }: { tag: Tag } = $props()

   function handleDelete() {
      if (confirm('Are you sure you want to delete this Tag?')) {
         tag.delete()
      }
   }
</script>

<button onclick={handleDelete} class="delete-button">
   Delete Tag
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