<script lang="ts">
   import { type CategorySchema } from "../generated/data.js";

   type SelectEvent = Event & { currentTarget: EventTarget & HTMLSelectElement }

   let { categorys, callback }: { categorys: CategorySchema[], callback: (id: string) => void } = $props()
</script>

<select onchange={(event: SelectEvent) => callback(event.currentTarget.value)}>
   <option selected value='' disabled>Select Category</option>
   {#each categorys as category}
      <option value={category.id}>{category.name}</option>
   {/each}
</select>