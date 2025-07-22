<script lang="ts">
   import { type Tag } from '$lib/generated/classes/Tag.svelte.js'

   let { tag }: { tag: Tag } = $props()
</script>

<input type="text" bind:value={tag.data.name} />
<input type="text" bind:value={tag.data.color} />


