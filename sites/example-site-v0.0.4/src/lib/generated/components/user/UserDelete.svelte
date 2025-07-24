<script lang="ts">
   import { type User } from '../generated/classes/User.svelte.js'

   let { user }: { user: User } = $props()

   function handleDelete() {
      if (confirm('Are you sure you want to delete this User?')) {
         user.delete()
      }
   }
</script>

<button onclick={handleDelete} class="delete-button">
   Delete User
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