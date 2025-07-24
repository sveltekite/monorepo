<script lang="ts">
   import { type Post } from '../generated/classes/Post.svelte.js'

   let { post }: { post: Post } = $props()

   function handleDelete() {
      if (confirm('Are you sure you want to delete this Post?')) {
         post.delete()
      }
   }
</script>

<button onclick={handleDelete} class="delete-button">
   Delete Post
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