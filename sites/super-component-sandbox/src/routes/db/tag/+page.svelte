<script lang="ts">
	import { getTags, createTag } from '$lib/remote/db.remote';

	// @ts-expect-error
	const tags = $derived(await getTags());

	function _createTag() {
		createTag({
			name: "gutentag",
			color: 'cyan'
		});
	}
</script>

<ul>
	{#each tags as tag}
		<li><a href={`/db/tag/${tag.id}`}>{tag.name}</a></li>
	{/each}
</ul>

<button onclick={_createTag}>Create Tag</button>
