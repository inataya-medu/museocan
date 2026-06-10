<script lang="ts">
	import { authorProfiles } from '$lib/config';
	import TagList from '$lib/components/TagList.svelte';
	import { groupAuthorsByRole, normalizeZoteroAuthors } from '$lib/utilities/authors';

	type Props = { publication: ZoteroPublication };

	let { publication }: Props = $props();

	const SOURCE_BY_ITEM_TYPE: Record<string, (publication: ZoteroPublication) => string | undefined> = {
		book: (publication) => publication.publisher,
		thesis: (publication) => publication.university,
		report: (publication) => publication.institution || publication.publisher,
		webpage: (publication) => publication.websiteTitle || publication.publicationTitle,
		blogPost: (publication) => publication.websiteTitle || publication.publicationTitle,
		journalArticle: (publication) => publication.publicationTitle || publication.journalAbbreviation,
		magazineArticle: (publication) => publication.publicationTitle || publication.journalAbbreviation,
		newspaperArticle: (publication) => publication.publicationTitle || publication.journalAbbreviation,
		bookSection: (publication) => publication.publicationTitle,
		conferencePaper: (publication) => publication.publicationTitle,
		encyclopediaArticle: (publication) => publication.publicationTitle,
		dictionaryEntry: (publication) => publication.publicationTitle
	};

	const getContextSource = (publication: ZoteroPublication) => {
		const sourceResolver = SOURCE_BY_ITEM_TYPE[publication.itemType];
		return sourceResolver ? sourceResolver(publication) : publication.publicationTitle;
	};

	const normalizedAuthors = $derived(normalizeZoteroAuthors(publication.creators, authorProfiles));

	const creatorGroups = $derived(groupAuthorsByRole(normalizedAuthors));

	const sourceLine = $derived(getContextSource(publication));
	const publicationDate = $derived(publication.parsedDate || publication.date);
	const hasLinks = $derived(Boolean(publication.doi || publication.url || publication.zoteroUrl));
</script>

<li class="zotero-reference">
	{#if publication.formattedCitation}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		<h3 class="formatted-reference">{@html publication.formattedCitation}</h3>
		<p class="title">{publication.title}</p>
	{:else}
		<h3>{publication.title}</h3>
	{/if}

	{#if creatorGroups.length > 0}
		<p class="authors">
			{#each creatorGroups as group, index (group.role)}
				{index > 0 ? ' | ' : ''}<span>{group.label}&nbsp;:</span>
				{#each group.authors as author, authorIndex (author.slug || author.id || `${author.name}-${authorIndex}`)}
					{authorIndex > 0 ? ', ' : ' '}{#if author.href}<a rel="author" href={author.href}>{author.name}</a>{:else}<span>{author.name}</span>{/if}
				{/each}
			{/each}
		</p>
	{/if}

	{#if publication.tags && publication.tags.length > 0}
		<TagList tags={publication.tags} label="Tags de la publication" />
	{/if}

	{#if sourceLine || publicationDate}
		<p class="meta">
			{#if sourceLine}
				<span>{sourceLine}</span>
			{/if}
			{#if sourceLine && publicationDate}
				<span> · </span>
			{/if}
			{#if publicationDate}
				<span>{publicationDate}</span>
			{/if}
		</p>
	{/if}

	{#if hasLinks}
		<div class="links">
			{#if publication.doi}
				<a href="https://doi.org/{publication.doi}" target="_blank" rel="noopener noreferrer">DOI</a>
			{/if}
			{#if publication.url}
				<a href={publication.url} target="_blank" rel="noopener noreferrer">Lien</a>
			{/if}
			{#if publication.zoteroUrl}
				<a href={publication.zoteroUrl} target="_blank" rel="noopener noreferrer">Zotero</a>
			{/if}
		</div>
	{/if}

	{#if publication.detailFields.length > 0 || publication.abstractNote || publication.formattedCitation}
		<details class="details">
			{#if publication.detailFields.length > 0}
				<div class="fields">
					<dl>
						{#each publication.detailFields as field (field.key)}
							<dt>{field.key}</dt>
							{#if field.key === 'creators' && creatorGroups.length > 0}
								<dd>
									{#each creatorGroups as group, index (group.role)}
										<span>{group.label}&nbsp;:</span>
										{#each group.authors as author, authorIndex (author.slug || author.id || `${author.name}-${authorIndex}`)}
											{authorIndex > 0 ? ', ' : ' '}{#if author.href}<a rel="author" href={author.href}>{author.name}</a>{:else}<span>{author.name}</span>{/if}
										{/each}
										{#if index < creatorGroups.length - 1}
											<br />
										{/if}
									{/each}
								</dd>
							{:else}
								<!-- eslint-disable-next-line svelte/no-at-html-tags -->
								<dd>{@html field.value}</dd>
							{/if}
						{/each}
					</dl>
				</div>
			{/if}
		</details>
	{/if}
</li>

<style>
	dl {
		display: grid;
		grid-template-columns: minmax(8rem, auto) 1fr;
		gap: 0.25rem 0.75rem;
		margin: 0.5rem 0 0;
	}

	dt {
		font-weight: 600;
	}

	dd {
		margin: 0;
		word-break: break-word;
	}
</style>
