<script lang="ts">
	import { editPost } from '$lib/remote/post.remote';

	let { post } = $props();
</script>

POST SUB 2

{JSON.stringify(post)}

<form {...editPost}>
	<input name="id" type="hidden" value={post?.id} />
	<input name="value" type="text" value={post?.value || ''} />
	<button type="submit">Edit!</button>
</form>
