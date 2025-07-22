<script lang="ts">
   import { type PostSchema } from "$lib/generated/data.js";

   type SelectEvent = Event & { currentTarget: EventTarget & HTMLSelectElement }

   let { posts, callback }: { posts: PostSchema[], callback: (id: string) => void } = $props()
</script>

<select onchange={(event: SelectEvent) => callback(event.currentTarget.value)}>
   <option selected value='' disabled>Select Post</option>
   {#each posts as post}
      <option value={post.id}>{post.title}</option>
   {/each}
</select>
