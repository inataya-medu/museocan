<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';

	import * as config from '$lib/config';
	import * as seo from '$lib/utilities/seo';

	import Breadcrumb from '$lib/components/Breadcrumb.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Nav from '$lib/components/Nav.svelte';

	let { children } = $props();
	const canonical = $derived(seo.getCanonicalUrl(page.url.pathname));

	// Read metadata from page.data.metadata (+page.ts)
	const metadata = $derived(page.data?.metadata ?? {});
	const pageTitle = $derived(metadata.title ? `${metadata.title} | ${config.siteTitle}` : config.siteTitle);
	const pageDescription = $derived(metadata.description || config.siteDescription);
	const url = $derived(resolve('/rss.xml'));
</script>

<!-- SEO from page.data.metadata. Pages can override with their own <svelte:head>. -->
<svelte:head>
	<title>{pageTitle}</title>
	<meta name="description" content={pageDescription} />
	<link rel="canonical" href={canonical} />
	<link rel="alternate" type="application/rss+xml" title={`${config.siteTitle} RSS`} href={url} />
</svelte:head>

<a class="skip-link" href="#page-content">Aller au contenu principal</a>

<header>
	<Nav />
</header>
<main>
	<Breadcrumb />
	<article id="page-content" tabindex="-1">
		{@render children?.()}
	</article>
</main>
<Footer />

<style>
	.skip-link {
		position: absolute;
		clip-path: inset(50%);
	}

	.skip-link:focus-visible {
		clip-path: none;
	}

	:global(article :is(h1, h2, h3, h4, h5, h6) .heading-anchor) {
		color: var(--color-link, #118bee);
		font-size: 0.85em;
		margin-left: 0.25rem;
		opacity: 0;
		text-decoration: none;
		transition: opacity 0.2s;
	}

	:global(article :is(h1, h2, h3, h4, h5, h6):hover .heading-anchor),
	:global(article :is(h1, h2, h3, h4, h5, h6):focus-within .heading-anchor) {
		opacity: 0.3;
	}

	/* Footnotes */
	:global(article .footnotes) {
		margin-top: 2rem;
		padding-top: 1rem;
		border-top: 1px solid var(--color-bg-secondary, #e0e0e0);
		font-size: 0.9em;
	}

	:global(article .footnotes ol) {
		padding-left: 1.5rem;
	}

	/* In-text footnote calls */
	:global(article sup[id^="fnref-"]) {
		background: none;
		padding: 0;
	}

	:global(article a.footnote-ref) {
		color: var(--color-text);
		text-decoration: none;
	}

	:global(article a.footnote-ref:hover) {
		text-decoration: underline;
	}

	/* Back link inside footnotes */
	:global(article .footnote-backref) {
		text-decoration: none;
	}

	/* Paragraph numbering in the left margin */
	:global(article) {
		counter-reset: paragraph;
		position: relative;
	}

	:global(article > p) {
		counter-increment: paragraph;
		position: relative;
	}

	:global(article > p::before) {
		content: counter(paragraph);
		position: absolute;
		left: -2rem;
		color: var(--color-link, #118bee);
		opacity: 0.3;
		user-select: none;
	}

	/* Do not number paragraphs inside footnotes */
	:global(article .footnotes) {
		counter-reset: none;
	}

	:global(article .footnotes p) {
		counter-increment: none;
	}

	:global(article .footnotes p::before) {
		content: none;
	}
</style>