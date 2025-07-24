<script lang="ts">
   // @ts-nocheck
   import { type __CLASS_NAME__Schema } from "$lib/generated/data.js";

   let { __RELATION_NAME__, remove }: { __RELATION_NAME__: __CLASS_NAME__Schema[], remove: (id: string) => void } = $props()
</script>

{#each __RELATION_NAME__ as __ENTITY_NAME__}
   <span __STYLE_ATTRIBUTE__>
      {__ENTITY_NAME__.__DISPLAY_FIELD__}
      <button onclick={() => remove(__ENTITY_NAME__.id)}>×</button>
   </span>
{/each}
