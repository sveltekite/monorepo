<script lang="ts">
   import { getPersons } from './test.remote.js'
</script>

<ul>
   {#each await getPersons() as { name, age }}
      <li><a href={`/${name}`}>{name} is {age} </a></li>
   {/each}
</ul>
