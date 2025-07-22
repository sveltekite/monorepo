<script lang="ts">
   let { data }: { data: Record<string, Record<string, any>>} = $props()
</script>

{#each Object.values(data) as obj}
   <obj.detail />
{/each}
