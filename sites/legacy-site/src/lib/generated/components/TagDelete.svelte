<script lang="ts">
   import { type TagSchema } from '$lib/generated/data.js'

   let { tag, callback }: { tag: TagSchema, callback: (id: string) => void } = $props()
</script>

<button onclick={() => callback(tag.id)}>x</button>
