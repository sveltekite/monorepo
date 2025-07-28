<script lang="ts">
	import { createPost } from '../data.remote';
</script>

<h1>Create a new post</h1>

<form {...createPost}>
	<input type="text" name="title" autocomplete="off" required />
	<textarea name="content" required></textarea>
	<button>post</button>
</form>

<style>
	input,
	textarea {
		display: block;
		width: 100%;
	}

	textarea {
		height: 10rem;
	}
</style>
