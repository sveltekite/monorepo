<script lang="ts">
   import { type PostSchema } from '$lib/generated/data.js'

   let { post, callback }: { post: PostSchema, callback: (id: string) => void } = $props()
</script>

<button onclick={() => callback(post.id)}>x</button>
