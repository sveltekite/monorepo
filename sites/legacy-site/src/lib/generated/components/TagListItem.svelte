<script lang="ts">
   import { type Tag } from '$lib/generated/classes/Tag.svelte.js'

   let { tag }: { tag: Tag } = $props()
</script>

<span style={`color: ${tag.data.color}`}>{tag.data.name}</span>
