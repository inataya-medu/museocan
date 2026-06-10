import { resolve } from '$app/paths';
import type { PageLoad } from './$types';
import { redirect } from '@sveltejs/kit';

import * as config from '$lib/config';

const withBase = (path: string): string =>
	path.startsWith('/') ? `${resolve('/')}${path.slice(1)}` : path;

export const load: PageLoad = async () => {
	const authors = Object.entries(config.authorProfiles)
		.map(([id, profile]) => ({
			id,
			slug: profile.slug,
			name: profile.name || profile.slug,
			href: profile.href
				? withBase(profile.href)
				: resolve('/auteurs/[slug]', { slug: profile.slug })
		}))
		.sort((left, right) => left.name.localeCompare(right.name, 'fr'));

	if (authors.length === 1 && authors[0].href.startsWith('/')) {
		throw redirect(307, authors[0].href);
	}

	return {
		authors,
		metadata: {
			title: 'Auteurs',
			description: 'Index des profils auteurs'
		}
	};
};
