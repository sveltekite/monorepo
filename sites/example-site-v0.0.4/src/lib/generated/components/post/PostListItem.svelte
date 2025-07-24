<script lang="ts">
   import { type Post } from '../generated/classes/Post.svelte.js'

   let { post }: { post: Post } = $props()
</script>

<span>{post.data.title}</span>