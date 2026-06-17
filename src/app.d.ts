import type { Component } from 'svelte';

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		interface PageData {
			metadata?: {
				title?: string;
				description?: string;
				author?: BlogAuthorInput | BlogAuthorInput[];
				slug?: string;
				[key: string]: unknown;
			};
		}
		// interface PageState {}
		// interface Platform {}
	}

	interface Author {
		id?: string;
		slug?: string;
		name: string;
		href?: string;
		role?: string;
	}

	interface BlogAuthor {
		id?: string;
		slug?: string;
		name?: string;
		href?: string;
	}

	type BlogAuthorInput = string | BlogAuthor;

	interface Heading {
		depth: 2 | 3;
		text: string;
		id: string;
	}

	interface Posts {
		slug?: string;
		title: string;
		author?: BlogAuthorInput | BlogAuthorInput[];
		description: string;
		date: string | Date;
		readingTime?: number;
		tags?: string[] | string;
		published: boolean;
		[key: string]: unknown;
	}

	interface OrcidProfile {
		name?: string;
		biography?: string;
		affiliations?: OrcidAffiliation[];
		works?: OrcidWork[];
		email?: string;
		urls?: OrcidUrl[];
		error?: string;
	}

	interface OrcidAffiliation {
		title?: string;
		organization?: string;
		startDate?: string;
		endDate?: string;
	}

	interface OrcidWork {
		title?: string;
		type?: string;
		date?: string;
		url?: string;
		doi?: string;
	}

	interface OrcidUrl {
		name?: string;
		url?: string;
	}

	interface ZoteroDetailField {
		key: string;
		value: string;
	}

	interface ZoteroCreator {
		creatorType?: string;
		firstName?: string;
		lastName?: string;
		name?: string;
	}

	interface ZoteroPublication {
		key: string;
		title: string;
		itemType: string;
		date?: string;
		parsedDate?: string;
		creators: ZoteroCreator[];
		tags?: string[];
		abstractNote?: string;
		formattedCitation?: string;
		detailFields: ZoteroDetailField[];
		publicationTitle?: string;
		publisher?: string;
		university?: string;
		institution?: string;
		websiteTitle?: string;
		journalAbbreviation?: string;
		url?: string;
		doi?: string;
		zoteroUrl?: string;
	}

	interface ZoteroPublicationGroup {
		key: string;
		label: string;
		publications: ZoteroPublication[];
	}

	interface ZoteroPublicationsResult {
		username: string;
		userId?: number;
		displayName?: string;
		publications?: ZoteroPublication[];
		sourceUrl?: string;
		updatedAt?: string;
		error?: string;
	}
}

export {};

declare module '*.md' {
	const component: Component;
	export default component;
	export const metadata: Record<string, unknown>;
}

declare module '*.svx' {
	const component: Component;
	export default component;
	export const metadata: Record<string, unknown>;
}
