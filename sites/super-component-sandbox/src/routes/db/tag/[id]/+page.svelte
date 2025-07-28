<script lang="ts">
   import { getTag } from '$lib/remote/db.remote'

   let { params } = $props()

   // @ts-expect-error
   const tag = $derived(await getTag(params.id))
</script>

{tag?.name}

{tag?.color}
