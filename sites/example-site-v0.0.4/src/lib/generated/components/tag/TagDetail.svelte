<script lang="ts">
   import { type Tag } from '../generated/classes/Tag.svelte.js'

   let { tag }: { tag: Tag } = $props()
</script>

<input type="text" bind:value={tag.data.name} />
<input type="color" bind:value={tag.data.color} />

