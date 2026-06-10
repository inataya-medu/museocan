import type { PageServerLoad } from './$types';

import { loadZoteroPublications } from '$lib/utilities/loadZoteroPublications';

export const load: PageServerLoad = async ({ fetch }) => {
	const zoteroPublications = await loadZoteroPublications(fetch);

	return {
		metadata: {
			title: 'Publications',
			description: 'Liste des publications Zotero'
		},
		zoteroPublications
	};
};
