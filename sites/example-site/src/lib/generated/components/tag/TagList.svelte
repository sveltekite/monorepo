<script lang="ts">
   import { type TagSchema } from "$lib/generated/data.js";
   import TagDelete from './TagDelete.svelte'

   let { tags, remove }: { tags: TagSchema[], remove?: (tagId: string) => void } = $props();
</script>

<ul style="display: flex; gap: 1em;">
   {#each tags as tag}
      <li style={`color: black; background-color: ${tag.color || 'grey'}; padding: 0.25em .5em; border-radius: 0.25em;`}>
         {tag.name}
         {#if remove}
            <TagDelete {tag} callback={remove} />
         {/if}
      </li>
   {/each}
</ul>
