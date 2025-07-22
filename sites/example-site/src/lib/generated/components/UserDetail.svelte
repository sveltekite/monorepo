<script lang="ts">
   import { type User } from '$lib/generated/classes/User.svelte.js'

   let { user }: { user: User } = $props()
</script>

<input type="text" bind:value={user.data.name} />
<input type="text" bind:value={user.data.email} />


