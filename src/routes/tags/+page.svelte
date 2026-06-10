<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';
	import * as config from '$lib/config';

	let { data }: PageProps = $props();
	const url = (tag: string) => resolve('/tags/[tag]', { tag });
</script>

<svelte:head>
	<title>Tags | {config.siteTitle}</title>
	<meta name="description" content="Index des tags des billets et des publications" />
</svelte:head>

<h1>Tags</h1>

<section aria-label="Tags des billets">
	<h2>Billets</h2>
	{#if data.postTags.length === 0}
		<p>Aucun tag pour les billets.</p>
	{:else}
		<ul>
			{#each data.postTags as tag (tag.slug)}
				<li>
					<a href={url(tag.slug)}>#{tag.tag}</a> ({tag.count})
				</li>
			{/each}
		</ul>
	{/if}
</section>

<section aria-label="Tags des publications">
	<h2>Publications</h2>
	{#if data.publicationTags.length === 0}
		<p>Aucun tag pour les publications.</p>
	{:else}
		<ul>
			{#each data.publicationTags as tag (tag.slug)}
				<li>
					<a href={url(tag.slug)}>#{tag.tag}</a> ({tag.count})
				</li>
			{/each}
		</ul>
	{/if}
</section>
