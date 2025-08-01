<script lang="ts">
   import { updatePerson } from '../test.remote.js'

   let { person } = $props()
</script>

<form {...updatePerson}>
   <input name="name" type="hidden" value={person?.name} />
   <input name="age" type="number" value={person?.age} />
   <button type="submit">Update</button>
</form>
