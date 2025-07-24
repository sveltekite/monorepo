<script lang="ts">
   import { type TagSchema } from "../generated/data.js";

   type SelectEvent = Event & { currentTarget: EventTarget & HTMLSelectElement }

   let { tags, callback }: { tags: TagSchema[], callback: (id: string) => void } = $props()
</script>

<select onchange={(event: SelectEvent) => callback(event.currentTarget.value)}>
   <option selected value='' disabled>Select Tag</option>
   {#each tags as tag}
      <option value={tag.id}>{tag.name}</option>
   {/each}
</select>