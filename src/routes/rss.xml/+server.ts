import * as config from '$lib/config';
import { loadPublishedPosts } from '$lib/utilities/loadPublishedPosts';
import { getCanonicalUrl } from '$lib/utilities/seo';

export const prerender = true;

const escapeXml = (value: string) =>
	value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&apos;');

const toRssDate = (date: string) => new Date(`${date}T00:00:00Z`).toUTCString();

export const GET = async () => {
	const posts = await loadPublishedPosts();
	const siteUrl = getCanonicalUrl('/');
	const feedUrl = getCanonicalUrl('/rss.xml');
	const lastBuildDate = posts[0] ? toRssDate(posts[0].metadata.date) : new Date().toUTCString();

	const items = posts
		.map((post) => {
			const url = getCanonicalUrl(`/blog/${post.slug}`);
			const description = post.metadata.description || config.siteDescription;

			return `
	<item>
		<title>${escapeXml(post.metadata.title)}</title>
		<link>${escapeXml(url)}</link>
		<guid isPermaLink="true">${escapeXml(url)}</guid>
		<pubDate>${toRssDate(post.metadata.date)}</pubDate>
		<description>${escapeXml(description)}</description>
	</item>`;
		})
		.join('');

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
	<title>${escapeXml(config.siteTitle)}</title>
	<link>${escapeXml(siteUrl)}</link>
	<description>${escapeXml(config.siteDescription)}</description>
	<language>fr-FR</language>
	<lastBuildDate>${lastBuildDate}</lastBuildDate>
	<atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />${items}
</channel>
</rss>`;

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/rss+xml; charset=utf-8'
		}
	});
};