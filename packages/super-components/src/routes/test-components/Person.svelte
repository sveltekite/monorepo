<script lang="ts" module>
   import { type SubComponentMap } from '$lib/classes/SuperComponent.svelte.js'
   import PersonEdit from "./PersonEdit.svelte";

   export const components: SubComponentMap = {
      edit: [PersonEdit, ["person"]],
   };
</script>

<script lang="ts">
   let { instance, person } = $props();
</script>

({person?.name} is {person?.age})

<instance.edit />
