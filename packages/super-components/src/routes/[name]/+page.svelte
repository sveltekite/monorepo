<script lang="ts">
   import { SuperComponent } from "$lib/classes/SuperComponent.svelte.js";
   import Person, { components } from "../test-components/Person.svelte";

   import { getPerson } from '../test.remote.js'

   let { params } = $props()

   const queries = {
      person: getPerson(params.name)
   }

   const person = new SuperComponent(Person, queries, components)
</script>

<person.svelte />
