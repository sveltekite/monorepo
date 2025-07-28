<script lang="ts">
   import { SuperComponent } from "$lib/classes/SuperComponent.svelte";
   import PostDetail from '$lib/post/PostDetail.svelte'
   import PostSub from '$lib/post/PostSub.svelte'
   import TagList from '$lib/post/TagList.svelte'
   import { getPost } from "$lib/remote/post.remote";
   import { getTags } from "$lib/remote/tag.remote"

   let { params } = $props()

   const postDetail = new SuperComponent(PostDetail, {
      post: getPost(params.id.toString()),
      tags: getTags()
   }, {
      sub: [PostSub, [ 'post' ]],
      tags: [TagList, [ 'tags' ]]
   })
</script>

<postDetail.svelte />
