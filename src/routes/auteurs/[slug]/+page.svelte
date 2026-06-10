<script lang="ts">
	import type { PageProps } from './$types';
	import * as config from '$lib/config';

	let { data }: PageProps = $props();
	const author = $derived(data.author);
	const orcidProfile = $derived(data.orcidProfile);
	const heading = $derived(orcidProfile?.name || author.name || author.slug);
	const orcidId = $derived(author.orcidId);
</script>

<svelte:head>
	<title>{heading ? `${heading} | ${config.siteTitle}` : config.siteTitle}</title>
	<meta name="description" content={data.metadata?.description || config.siteDescription} />
</svelte:head>

<section class="author-section">
	<h1>{heading}</h1>

	{#if orcidId}
		<p>
			<a href="https://orcid.org/{orcidId}" target="_blank" rel="noopener noreferrer">ORCID: {orcidId}</a>
		</p>
	{/if}

	{#if orcidProfile?.error}
		<p class="error">⚠️ {orcidProfile.error}</p>
	{:else if orcidProfile}
		{#if orcidProfile.biography}
			<div class="biography">
				<h2>Présentation</h2>
				<p>{orcidProfile.biography}</p>
			</div>
		{/if}

		{#if orcidProfile.affiliations && orcidProfile.affiliations.length > 0}
			<div class="affiliations">
				<h2>Emplois</h2>
				<ul>
					{#each orcidProfile.affiliations as affiliation, index (`${affiliation.title || 'affiliation'}-${affiliation.organization || ''}-${index}`)}
						<li>
							<strong>{affiliation.title || affiliation.organization || 'Poste'}</strong>
							{#if affiliation.organization}
								— {affiliation.organization}
							{/if}
							{#if affiliation.startDate}
								<span class="date">
									({affiliation.startDate}
									{#if affiliation.endDate}
										- {affiliation.endDate}
									{:else}
										- aujourd'hui
									{/if})
								</span>
							{/if}
						</li>
					{/each}
				</ul>
			</div>
		{/if}

		{#if orcidProfile.works && orcidProfile.works.length > 0}
			<div class="works">
				<h2>Publications récentes</h2>
				<ul>
					{#each orcidProfile.works as work, index (work.doi || work.url || `${work.title || 'work'}-${work.date || ''}-${index}`)}
						<li>
							<strong>{work.title}</strong>
							{#if work.type}
								<span class="type">({work.type})</span>
							{/if}
							{#if work.date}
								<span class="date">{work.date}</span>
							{/if}
							{#if work.doi}
								<a href="https://doi.org/{work.doi}" target="_blank" rel="noopener noreferrer">DOI</a>
							{/if}
							{#if work.url}
								<a href={work.url} target="_blank" rel="noopener noreferrer">Voir</a>
							{/if}
						</li>
					{/each}
				</ul>
			</div>
		{/if}

		{#if orcidProfile.urls && orcidProfile.urls.length > 0}
			<div class="links">
				<h2>Liens</h2>
				<ul>
					{#each orcidProfile.urls as url, index (url.url || `${url.name || 'url'}-${index}`)}
						<li>
							{#if url.url}
								<a href={url.url} target="_blank" rel="noopener noreferrer">{url.name || url.url}</a>
							{:else}
								{url.name}
							{/if}
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	{:else}
		<p>Profil ORCID non configuré pour cet auteur.</p>
	{/if}
</section>
