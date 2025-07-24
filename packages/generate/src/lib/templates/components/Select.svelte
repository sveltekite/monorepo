<script lang="ts">
   // @ts-nocheck
   import { type __CLASS_NAME__Schema } from "$lib/generated/data.js";

   type SelectEvent = Event & { currentTarget: EventTarget & HTMLSelectElement }

   let { __ENTITY_NAME__s, callback }: { __ENTITY_NAME__s: __CLASS_NAME__Schema[], callback: (id: string) => void } = $props()
</script>

<select onchange={(event: SelectEvent) => callback(event.currentTarget.value)}>
   <option selected value='' disabled>Select __ENTITY_DISPLAY_NAME__</option>
   {#each __ENTITY_NAME__s as __ENTITY_NAME__}
      <option value={__ENTITY_NAME__.id}>{__ENTITY_NAME__.__DISPLAY_FIELD__}</option>
   {/each}
</select>
