import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	const modules = import.meta.glob('./+page.md');
	const resolver = modules['./+page.md'];
	const module = (await resolver?.()) as { metadata?: Record<string, unknown> } | undefined;

	return {
		metadata: module?.metadata ?? {}
	};
};
