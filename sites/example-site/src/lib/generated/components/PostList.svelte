<script lang="ts">
   import { type PostSchema } from "$lib/generated/data.js";
   import PostDelete from './PostDelete.svelte'

   let { posts, remove }: { posts: PostSchema[], remove?: (postId: string) => void } = $props();
</script>

<ul style="display: flex; gap: 1em;">
   {#each posts as post}
      <li style="padding: 0.25em .5em; border-radius: 0.25em; background-color: #f0f0f0;">
         {post.title}
         {#if remove}
            <PostDelete {post} callback={remove} />
         {/if}
      </li>
   {/each}
</ul>
