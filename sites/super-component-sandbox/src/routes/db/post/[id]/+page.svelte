<script lang="ts">
	import { getPost, getTags, getPostTags, addTagToPost } from '$lib/remote/db.remote';
	let { params } = $props();

	const postQuery = getPost(params.id);
	const tagsQuery = getTags();
	const postTagsQuery = getPostTags(params.id);
</script>

{#await postQuery}
	<p>Loading post...</p>
{:then post}
	<h1>{post?.title}</h1>
	<p>{post?.content}</p>
{:catch error}
	<p>Error loading post: {error.message}</p>
{/await}

<h2>Post Tags</h2>
{#await postTagsQuery}
	<p>Loading post tags...</p>
{:then tags}
	<ul>
		{#each tags as tag}
			<li>
				{tag?.name}<button onclick={() => addTagToPost({ postId: params.id, tagId: tag.id })}
					>Add Tag To Post</button
				>
			</li>
		{/each}
	</ul>
{:catch error}
	<p>Error loading post tags: {error.message}</p>
{/await}

<h2>Add Tag</h2>
{#await tagsQuery}
	<p>Loading tags...</p>
{:then tags}
	<ul>
		{#each tags as tag}
			<li>
				{tag?.name}<button onclick={() => addTagToPost({ postId: params.id, tagId: tag.id })}
					>Add Tag To Post</button
				>
			</li>
		{/each}
	</ul>
{:catch error}
	<p>Error loading tags: {error.message}</p>
{/await}
