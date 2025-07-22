<script lang="ts">
   import { type Article } from "$lib/generated/classes/Article.svelte.js";

   let { article }: { article: Article } = $props();

   // @ts-expect-error: ts 1308
   let user = $derived(await article.user);
</script>

{user?.name}
<div class="article">
   <label for="title">Title</label><br />
   <input name="title" type="text" bind:value={article.data.title} />
   <!-- by {#key article.data.userId}<article.user />{/key} (Instance component) -->
   <!-- by {article._user?.name} (reactive data) -->
   <article.selectUser callback={article.updateUser} />
</div>
<div>
   <article.tags /><br />
   Add Tag: <article.selectTags callback={article.addTag} />
</div>
<div>
   <label for="body">Body</label><br />
   <textarea name="body" bind:value={article.data.body} rows="10" cols="40"
   ></textarea>
</div>
