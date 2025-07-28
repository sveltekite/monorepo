<script lang="ts">
	let { tags } = $props();
</script>

<ul>
	{#each tags as tag}
		<li>{tag.id} | {tag.value}</li>
	{/each}
</ul>
