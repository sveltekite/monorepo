<script lang="ts">
   import { type Category } from '../generated/classes/Category.svelte.js'

   let { category }: { category: Category } = $props()
</script>

<input type="text" bind:value={category.data.name} />

<div>
   <category.posts /><br />
   Add Post: <category.selectPosts callback={category.addPost} />
</div>