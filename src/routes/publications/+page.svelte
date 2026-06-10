<script lang="ts">
	import type { PageProps } from './$types';
	import * as config from '$lib/config';
	import ZoteroReference from '$lib/components/ZoteroReference.svelte';
	import { formatDisplayDateTime } from '$lib/utilities/dates';

	let { data }: PageProps = $props();

	const ITEM_TYPES = {
		books: ['book'],
		journalArticles: ['journalArticle', 'magazineArticle', 'newspaperArticle'],
		bookChapters: ['bookSection'],
		conferencePapers: ['conferencePaper'],
		encyclopediaArticles: ['encyclopediaArticle', 'dictionaryEntry'],
		presentations: ['presentation'],
		documents: ['document'],
		reports: ['report'],
		theses: ['thesis'],
		webPublications: ['webpage', 'blogPost']
	} satisfies Record<string, string[]>;

	const publications = $derived(data.zoteroPublications.publications ?? []);

	const getPublicationsByTypes = (itemTypes: string[]) =>
		publications.filter((publication) => itemTypes.includes(publication.itemType));

	const updatedAt = $derived(formatDisplayDateTime(data.zoteroPublications.updatedAt, 'fr-CA'));
</script>

<svelte:head>
	<title>Publications | {config.siteTitle}</title>
	<meta name="description" content={config.siteDescription} />
</svelte:head>

<section class="publications-section">
	{#if data.zoteroPublications.error}
		<p class="error">⚠️ {data.zoteroPublications.error}</p>
	{:else}
		<h1>
			Publications
			{#if data.zoteroPublications.displayName}
				de {data.zoteroPublications.displayName}
			{/if}
		</h1>

		<p>
			<a
				href="https://www.zotero.org/{data.zoteroPublications.username}"
				target="_blank"
				rel="noopener noreferrer"
			>
				Profil Zotero: {data.zoteroPublications.username}
			</a>
		</p>

		{@const books = getPublicationsByTypes(ITEM_TYPES.books)}
		{#if books.length > 0}
			<section class="publication-group">
				<h2>Livres</h2>
				<ul class="publications-list">
					{#each books as publication (publication.key)}
						<ZoteroReference {publication} />
					{/each}
				</ul>
			</section>
		{/if}

		{@const journalArticles = getPublicationsByTypes(ITEM_TYPES.journalArticles)}
		{#if journalArticles.length > 0}
			<section class="publication-group">
				<h2>Articles de revue</h2>
				<ul class="publications-list">
					{#each journalArticles as publication (publication.key)}
						<ZoteroReference {publication} />
					{/each}
				</ul>
			</section>
		{/if}

		{@const bookChapters = getPublicationsByTypes(ITEM_TYPES.bookChapters)}
		{#if bookChapters.length > 0}
			<section class="publication-group">
				<h2>Chapitres de livre</h2>
				<ul class="publications-list">
					{#each bookChapters as publication (publication.key)}
						<ZoteroReference {publication} />
					{/each}
				</ul>
			</section>
		{/if}

		{@const conferencePapers = getPublicationsByTypes(ITEM_TYPES.conferencePapers)}
		{#if conferencePapers.length > 0}
			<section class="publication-group">
				<h2>Articles de conférence</h2>
				<ul class="publications-list">
					{#each conferencePapers as publication (publication.key)}
						<ZoteroReference {publication} />
					{/each}
				</ul>
			</section>
		{/if}

		{@const encyclopediaArticles = getPublicationsByTypes(ITEM_TYPES.encyclopediaArticles)}
		{#if encyclopediaArticles.length > 0}
			<section class="publication-group">
				<h2>Articles d’encyclopédie</h2>
				<ul class="publications-list">
					{#each encyclopediaArticles as publication (publication.key)}
						<ZoteroReference {publication} />
					{/each}
				</ul>
			</section>
		{/if}

		{@const presentations = getPublicationsByTypes(ITEM_TYPES.presentations)}
		{#if presentations.length > 0}
			<section class="publication-group">
				<h2>Présentations</h2>
				<ul class="publications-list">
					{#each presentations as publication (publication.key)}
						<ZoteroReference {publication} />
					{/each}
				</ul>
			</section>
		{/if}

		{@const documents = getPublicationsByTypes(ITEM_TYPES.documents)}
		{#if documents.length > 0}
			<section class="publication-group">
				<h2>Documents</h2>
				<ul class="publications-list">
					{#each documents as publication (publication.key)}
						<ZoteroReference {publication} />
					{/each}
				</ul>
			</section>
		{/if}

		{@const reports = getPublicationsByTypes(ITEM_TYPES.reports)}
		{#if reports.length > 0}
			<section class="publication-group">
				<h2>Rapports</h2>
				<ul class="publications-list">
					{#each reports as publication (publication.key)}
						<ZoteroReference {publication} />
					{/each}
				</ul>
			</section>
		{/if}

		{@const theses = getPublicationsByTypes(ITEM_TYPES.theses)}
		{#if theses.length > 0}
			<section class="publication-group">
				<h2>Thèses et mémoires</h2>
				<ul class="publications-list">
					{#each theses as publication (publication.key)}
						<ZoteroReference {publication} />
					{/each}
				</ul>
			</section>
		{/if}

		{@const webPublications = getPublicationsByTypes(ITEM_TYPES.webPublications)}
		{#if webPublications.length > 0}
			<section class="publication-group">
				<h2>Réalisations web</h2>
				<ul class="publications-list">
					{#each webPublications as publication (publication.key)}
						<ZoteroReference {publication} />
					{/each}
				</ul>
			</section>
		{/if}

		{#if publications.length === 0}
			<p>Aucune publication disponible.</p>
		{/if}

		{#if data.zoteroPublications.sourceUrl}
			<p class="updated-at">
				Mis à jour
				{#if updatedAt}
					le {updatedAt}
				{/if}
				·
				<a href={data.zoteroPublications.sourceUrl} target="_blank" rel="noopener noreferrer">
					Source Zotero
				</a>
			</p>
		{/if}
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
