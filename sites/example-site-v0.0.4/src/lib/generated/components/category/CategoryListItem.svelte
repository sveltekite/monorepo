<script lang="ts">
   import { type Category } from '../generated/classes/Category.svelte.js'

   let { category }: { category: Category } = $props()
</script>

<span>{category.data.name}</span>