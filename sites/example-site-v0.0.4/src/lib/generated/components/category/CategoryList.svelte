<script lang="ts">
   import { type CategorySchema } from "../generated/data.js";

   let { categorys, remove }: { categorys: CategorySchema[], remove: (id: string) => void } = $props()
</script>

{#each categorys as category}
   <span style="padding: 0.25em .5em; border-radius: 0.25em; background-color: #f0f0f0;">
      {category.name}
      <button onclick={() => remove(category.id)}>×</button>
   </span>
{/each}