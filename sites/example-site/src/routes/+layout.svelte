<script lang="ts">
   import { db } from '$lib/generated/db.js'
</script>

{#if db}
<nav>
   <ul>
      <li><a href="/">Home</a></li>
      {#each db.tables.filter(t => !t.name.includes('_')) as { name }}
         <li><a href={`/${name}`}>{name}</a></li>
      {/each}
   </ul>
</nav>
<slot />
{:else}
   No Database Configured
{/if}
