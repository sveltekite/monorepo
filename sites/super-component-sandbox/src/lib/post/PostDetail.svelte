<script lang="ts">
   let { instance, post } = $props()
</script>

({post?.id} | {post?.value})

<hr />
<instance.sub />
<instance.tags />
