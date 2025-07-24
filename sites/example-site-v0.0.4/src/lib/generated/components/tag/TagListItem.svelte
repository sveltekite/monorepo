<script lang="ts">
   import { type Tag } from '../generated/classes/Tag.svelte.js'

   let { tag }: { tag: Tag } = $props()
</script>

<span>{tag.data.name}</span>