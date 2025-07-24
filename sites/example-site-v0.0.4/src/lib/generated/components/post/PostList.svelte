<script lang="ts">
   import { type PostSchema } from "../generated/data.js";

   let { posts, remove }: { posts: PostSchema[], remove: (id: string) => void } = $props()
</script>

{#each posts as post}
   <span style="padding: 0.25em .5em; border-radius: 0.25em; background-color: #f0f0f0;">
      {post.title}
      <button onclick={() => remove(post.id)}>×</button>
   </span>
{/each}