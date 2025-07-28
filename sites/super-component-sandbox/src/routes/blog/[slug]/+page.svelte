<script>
	import { getPost } from '../data.remote.js';

	let { params } = $props();

	let post = $derived(await getPost(params.slug));
</script>

<h1>{post.title}</h1>
<div>{@html post.content}</div>
