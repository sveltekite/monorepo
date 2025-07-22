<script lang="ts">
   import { type Article } from '$lib/generated/classes/Article.svelte.js'

   let { article }: { article: Article } = $props()
</script>

<strong>{article.data.title}</strong> by <article.author />
