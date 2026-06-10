import { resolve } from '$app/paths';
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

import * as config from '$lib/config';
import { loadOrcidProfile } from '$lib/utilities/loadOrcidProfile';

type ConfigAuthorProfile = (typeof config.authorProfiles)[string];

type ResolvedAuthorProfile = ConfigAuthorProfile & {
	id: string;
	slug: string;
	href: string;
};

const withBase = (path: string): string =>
	path.startsWith('/') ? `${resolve('/')}${path.slice(1)}` : path;

const findAuthorProfile = (slug: string): ResolvedAuthorProfile | null => {
	for (const [id, profile] of Object.entries(config.authorProfiles)) {
		if (profile.slug === slug) {
			return {
				...profile,
				id,
				href: profile.href
					? withBase(profile.href)
					: resolve('/auteurs/[slug]', { slug: profile.slug })
			};
		}
	}

	return null;
};

export const load: PageServerLoad = async ({ params }) => {
	const profile = findAuthorProfile(params.slug);
	if (!profile) {
		throw error(404, 'Auteur introuvable');
	}

	const orcidId = profile.orcidId;
	const orcidClientId = env.ORCID_CLIENT_ID;
	const orcidClientSecret = env.ORCID_CLIENT_SECRET;

	return {
		metadata: {
			title: profile.name ? `Auteur: ${profile.name}` : `Auteur: ${profile.slug}`,
			description: profile.name
				? `Profil auteur de ${profile.name}`
				: `Profil auteur ${profile.slug}`
		},
		author: profile,
		orcidProfile: orcidId
			? await loadOrcidProfile(orcidId, orcidClientId, orcidClientSecret)
			: null
	};
};