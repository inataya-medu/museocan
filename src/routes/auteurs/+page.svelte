<script lang="ts">
	import type { PageProps } from './$types';
	import * as config from '$lib/config';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Auteurs | {config.siteTitle}</title>
	<meta name="description" content={data.metadata?.description || config.siteDescription} />
</svelte:head>

<h1>Auteurs</h1>

{#if data.authors.length === 0}
	<p>Aucun profil auteur configuré.</p>
{:else}
	<ul>
		{#each data.authors as author (author.id)}
			<li>
				<a href={author.href}>{author.name}</a>
			</li>
		{/each}
	</ul>
{/if}
