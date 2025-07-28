<script lang="ts">
	import { getPosts, createPost } from '$lib/remote/db.remote';

	// @ts-expect-error
	const posts = $derived(await getPosts());

	function _createPost() {
		createPost({
			title: 'Hello there',
			content: 'General Kenobi',
			userId: '5'
		});
	}
</script>

<ul>
	{#each posts as post}
		<li><a href={`/db/post/${post.id}`}>{post.title}</a></li>
	{/each}
</ul>

<button onclick={_createPost}>Create Post</button>
