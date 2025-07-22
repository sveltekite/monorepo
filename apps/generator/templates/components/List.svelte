<script lang="ts">
   import { type {{ClassName}}Schema } from "$lib/generated/data.js";
   import {{ClassName}}Delete from './{{ClassName}}Delete.svelte'

   let { {{entityName}}s, remove }: { {{entityName}}s: {{ClassName}}Schema[], remove?: ({{entityName}}Id: string) => void } = $props();
</script>

<ul style="display: flex; gap: 1em;">
   {#each {{entityName}}s as {{entityName}}}
      <li {{styleAttribute}}>
         {{{entityName}}.{{displayField}}}
         {#if remove}
            <{{ClassName}}Delete {{{entityName}}} callback={remove} />
         {/if}
      </li>
   {/each}
</ul>
