<script lang="ts">
	import type { PageProps } from './$types';
	import * as config from '$lib/config';

	import PostNavigation from '$lib/components/PostNavigation.svelte';
	import TagList from '$lib/components/TagList.svelte';
	import { normalizeBlogAuthors } from '$lib/utilities/authors';

	let { data }: PageProps = $props();

	const post = $derived(data.post);
	const previousPost = $derived(data.previousPost);
	const nextPost = $derived(data.nextPost);
	const metadata = $derived(post.metadata);
	const Content = $derived(post.component);
	const authors = $derived(normalizeBlogAuthors(metadata.author, config.authorProfiles));
</script>

<svelte:head>
	<title>{metadata.title ? `${metadata.title} | ${config.siteTitle}` : config.siteTitle}</title>
	<meta name="description" content={metadata.description || config.siteDescription} />
</svelte:head>

<Content />

{#if authors.length > 0}
	<p>
		<strong>{authors.length > 1 ? 'Auteurs' : 'Auteur'}:</strong>
		{#each authors as author, index (author.slug || author.id || `${author.name}-${index}`)}
			{#if author.href}
				<a rel="author" href={author.href}>{author.name}</a>
			{:else}
				{author.name}
			{/if}
			{#if index < authors.length - 1}
				<span>, </span>
			{/if}
		{/each}
	</p>
{/if}

<TagList tags={metadata.tags} />

<PostNavigation {previousPost} {nextPost} baseRoute="/cours" />
