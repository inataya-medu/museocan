import type { EntryGenerator, PageLoad } from './$types';
import { error } from '@sveltejs/kit';

import { loadPublishedCours } from '$lib/utilities/loadPublishedCours';
import type { LoadedPost } from '$lib/utilities/loadPublishedCours';

const toNavigationPost = (post: LoadedPost) => ({
	slug: post.slug,
	title: post.metadata.title,
	date: post.metadata.date
});

export const entries: EntryGenerator = async () => {
	const allPosts = await loadPublishedCours();

	return allPosts.map((post) => ({ slug: post.slug }));
};

export const load: PageLoad = async ({ params }) => {
	const allPosts = await loadPublishedCours();
	const currentIndex = allPosts.findIndex((post) => post.slug === params.slug);
	if (currentIndex === -1) {
		throw error(404); // Post not found
	}
	const currentPost = allPosts[currentIndex];

	const previousPost = currentIndex < allPosts.length - 1 ? toNavigationPost(allPosts[currentIndex + 1]) : null;
	const nextPost = currentIndex > 0 ? toNavigationPost(allPosts[currentIndex - 1]) : null;

	return {
		post: currentPost,
		previousPost,
		nextPost,
		metadata: {
			title: currentPost.metadata.title,
			description: currentPost.metadata.description
		}
	};
};