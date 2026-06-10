import { siteURL } from '$lib/config';

export function getCanonicalUrl(path: string): string {
	const base = siteURL.startsWith('http') ? siteURL : `https://${siteURL}`;
	const normalizedPath = path.startsWith('/') ? path : `/${path}`;
	return `${base}${normalizedPath}`;
}
