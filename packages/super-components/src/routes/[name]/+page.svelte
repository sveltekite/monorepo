<script lang="ts">
   import { SuperComponent } from "$lib/classes/SuperComponent.svelte.js";
   import Person from "../test-components/Person.svelte";
   import PersonEdit from "../test-components/PersonEdit.svelte";

   import { getPerson } from '../test.remote.js'

   let { params } = $props()

   const person = new SuperComponent(Person, {
      person: getPerson(params.name)
   }, {
      edit: [PersonEdit, [ 'person' ]]
   })
</script>

<person.svelte />
