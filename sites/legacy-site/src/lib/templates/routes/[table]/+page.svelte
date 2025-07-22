<script lang="ts">
   import { invalidateAll } from "$app/navigation";

   type ValidClass = {
      create: Function
   }

   type Data = {
      entries: any[];
      constructor: ValidClass;
      table: string;
   };

   let { data }: { data: Data } = $props();

   function add() {
      data.constructor.create();
      invalidateAll();
   }
</script>

<h2>{data.table}s</h2>
<button onclick={add}>add</button>
<ul>
   {#each data.entries as el}
      <li><a href={`/${data.table}/${el.data.id}`}><el.listItem /></a></li>
   {/each}
</ul>
