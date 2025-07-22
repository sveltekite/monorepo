<script lang="ts">
   import { type Post } from '$lib/generated/classes/Post.svelte.js'

   let { post }: { post: Post } = $props()
</script>

<input type="text" bind:value={post.data.title} />
<label for="content">Content</label><br />
<textarea name="content" bind:value={post.data.content} rows="10" cols="40"></textarea>
<input type="text" bind:value={post.data.userId} />

<post.selectUser callback={post.updateUser} />
<div>
   <post.tags /><br />
   Add Tag: <post.selectTags callback={post.addTag} />
</div>
