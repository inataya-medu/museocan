import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';

import { loadPublishedPosts } from '$lib/utilities/loadPublishedPosts';
import type { LoadedPost } from '$lib/utilities/loadPublishedPosts';

const toNavigationPost = (post: LoadedPost) => ({
	slug: post.slug,
	title: post.metadata.title,
	date: post.metadata.date
});

export const load: PageLoad = async ({ params }) => {
	const allPosts = await loadPublishedPosts();
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