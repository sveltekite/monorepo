<script lang="ts">
   import { type UserSchema } from "../generated/data.js";

   type SelectEvent = Event & { currentTarget: EventTarget & HTMLSelectElement }

   let { users, callback }: { users: UserSchema[], callback: (id: string) => void } = $props()
</script>

<select onchange={(event: SelectEvent) => callback(event.currentTarget.value)}>
   <option selected value='' disabled>Select User</option>
   {#each users as user}
      <option value={user.id}>{user.name}</option>
   {/each}
</select>