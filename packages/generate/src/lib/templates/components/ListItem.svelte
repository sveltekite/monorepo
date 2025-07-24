<script lang="ts">
   // @ts-nocheck
   import { type __CLASS_NAME__ } from '$lib/generated/classes/__CLASS_NAME__.svelte.js'

   let { __ENTITY_NAME__ }: { __ENTITY_NAME__: __CLASS_NAME__ } = $props()
</script>

<span>{__ENTITY_NAME__.data.__DISPLAY_FIELD__}</span>
