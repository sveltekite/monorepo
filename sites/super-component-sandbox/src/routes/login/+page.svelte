<script lang="ts">
	import { login } from '$lib/auth.remote';
</script>

<h1>login</h1>

<form {...login}>
	<input type="text" name="name" autocomplete="off" required />
	<button>login</button>
</form>
