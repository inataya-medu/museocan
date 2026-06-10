<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';
	import * as config from '$lib/config';
	import ArticleCard from '$lib/components/ArticleCard.svelte';

	let { data }: PageProps = $props();
	const url = (tag: string) => resolve('/tags/[tag]', { tag });
</script>

<svelte:head>
	<title>Blog | {config.siteTitle}</title>
	<meta name="description" content={config.siteDescription} />
</svelte:head>

<h1>Liste des billets</h1>
<section aria-label="Articles du blog">
	{#each data.posts as post (post.slug)}
		<ArticleCard
			slug={post.slug}
			title={post.title}
			date={post.date}
			authors={post.author}
			readingTime={post.readingTime}
			tags={post.tags}
		/>
	{/each}
</section>

{#if data.tags.length > 0}
	<section aria-label="Tous les tags du site">
		<h2>Tous les tags</h2>
		<p>
			{#each data.tags as tag, index (tag.slug)}
				<a href={url(tag.slug)}>#{tag.tag} ({tag.count})</a>{index < data.tags.length - 1 ? ' · ' : ''}
			{/each}
		</p>
	</section>
{/if}
