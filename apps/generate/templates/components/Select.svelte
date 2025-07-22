<script lang="ts">
   import { type {{ClassName}}Schema } from "$lib/generated/data.js";

   type SelectEvent = Event & { currentTarget: EventTarget & HTMLSelectElement }

   let { {{entityName}}s, callback }: { {{entityName}}s: {{ClassName}}Schema[], callback: (id: string) => void } = $props()
</script>

<select onchange={(event: SelectEvent) => callback(event.currentTarget.value)}>
   <option selected value='' disabled>Select {{EntityName}}</option>
   {#each {{entityName}}s as {{entityName}}}
      <option value={{{entityName}}.id}>{{{entityName}}.{{displayField}}}</option>
   {/each}
</select>
