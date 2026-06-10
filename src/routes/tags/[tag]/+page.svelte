<script lang="ts">
	import type { PageProps } from './$types';
	import * as config from '$lib/config';
	import ArticleCard from '$lib/components/ArticleCard.svelte';
	import ZoteroReference from '$lib/components/ZoteroReference.svelte';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>{data.tag.name} | {config.siteTitle}</title>
	<meta name="description" content={`Ressources associées au tag ${data.tag.name}`} />
</svelte:head>

<h1>Tag: #{data.tag.name}</h1>
<p>{data.tag.postCount} billet(s) · {data.tag.publicationCount} publication(s)</p>

<section aria-label={`Articles pour le tag ${data.tag.name}`}>
	<h2>Billets</h2>
	{#if data.posts.length === 0}
		<p>Aucun billet pour ce tag.</p>
	{/if}
	{#each data.posts as post (post.slug)}
		<ArticleCard
			slug={post.slug}
			title={post.title}
			date={post.date}
			readingTime={post.readingTime}
			tags={post.tags}
			baseRoute="/blog"
		/>
	{/each}
</section>

<section aria-label={`Cours pour le tag ${data.tag.name}`}>
	<h2>Cours</h2>
	{#if data.cours.length === 0}
		<p>Aucun cours pour ce tag.</p>
	{/if}
	{#each data.cours as post (post.slug)}
		<ArticleCard
			slug={post.slug}
			title={post.title}
			date={post.date}
			readingTime={post.readingTime}
			tags={post.tags}
			baseRoute="/cours"
		/>
	{/each}
</section>

<section aria-label={`Publications pour le tag ${data.tag.name}`}>
	<h2>Publications</h2>
	{#if data.publications.length === 0}
		<p>Aucune publication pour ce tag.</p>
	{:else}
		<ul class="publications-list">
			{#each data.publications as publication (publication.key)}
				<ZoteroReference {publication} />
			{/each}
		</ul>
	{/if}
</section>

<style>
	.publications-list {
		list-style: none;
		padding-left: 0;
		display: grid;
		gap: 1rem;
	}
</style>
