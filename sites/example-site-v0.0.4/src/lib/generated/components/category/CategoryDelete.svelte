<script lang="ts">
   import { type Category } from '../generated/classes/Category.svelte.js'

   let { category }: { category: Category } = $props()

   function handleDelete() {
      if (confirm('Are you sure you want to delete this Category?')) {
         category.delete()
      }
   }
</script>

<button onclick={handleDelete} class="delete-button">
   Delete Category
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