<script lang="ts">
   import { type User } from '../generated/classes/User.svelte.js'

   let { user }: { user: User } = $props()
</script>

<span>{user.data.name}</span>