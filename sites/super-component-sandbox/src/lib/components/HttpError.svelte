<script lang="ts">
	import { type HttpError } from '@sveltejs/kit';

	let { key, error }: { key: string; error: HttpError } = $props();
</script>

<p>
	{key} query error:
	{error.status}: {error.body.message}
</p>
