import * as config from '$lib/config';

const ZOTERO_API_BASE = 'https://api.zotero.org';
const ITEM_KEY_BATCH_SIZE = 50;
const DEFAULT_LIMIT = 200;
const DEFAULT_STYLE = 'chicago-note-bibliography';
const DEFAULT_LOCALE = 'fr-FR';

type ReferenceContent = 'bib' | 'citation';

type ZoteroProfileConfig = {
	zoteroUsername: string;
	zoteroUserId: number;
};

const DEFAULT_REFERENCE_CONTENT: ReferenceContent = 'bib';
const ANCHOR_PATTERN = /<a\b/i;
const PRIORITY_DETAIL_FIELDS = [
	'title',
	'creators',
	'tags',
	'bib',
	'date',
	'DOI',
	'url',
	'publicationTitle',
	'journalAbbreviation',
	'publisher',
	'institution',
	'university',
	'itemType',
	'language',
	'abstractNote',
	'citation',
	'key',
	'parsedDate',
	'meta',
	'links'
] as const;

const PRIORITY_INDEX = new Map(PRIORITY_DETAIL_FIELDS.map((key, index) => [key, index]));
const EXCLUDED_DETAIL_FIELDS = new Set(['links', 'libraryCatalog', 'version']);

type ZoteroItem = {
	key: string;
	citation?: string;
	bib?: string;
	links?: { alternate?: { href?: string } };
	meta?: { parsedDate?: string };
	library?: { name?: string };
	data?: Record<string, unknown> & {
		itemType?: string;
		title?: string;
		abstractNote?: string;
		citation?: string;
		tags?: Array<{ tag?: string } | string>;
		date?: string;
		url?: string;
		DOI?: string;
		publisher?: string;
		university?: string;
		institution?: string;
		publicationTitle?: string;
		journalAbbreviation?: string;
		bookTitle?: string;
		proceedingsTitle?: string;
		websiteTitle?: string;
		parentItem?: string;
		creators?: Array<{
			creatorType?: string;
			firstName?: string;
			lastName?: string;
			name?: string;
		}>;
	};
};

type ResolvedZoteroConfig =
	| {
		ok: true;
		username: string;
		userId: number;
		style: string;
		locale: string;
		referenceContent: ReferenceContent;
	}
	| { ok: false; username: string; error: string };

export interface TaggedPublication {
	title: string;
	formattedCitation?: string;
	tags: string[];
	zoteroUrl?: string;
	date?: string;
	parsedDate?: string;
}

// Public API
export const loadZoteroPublications = async (fetchFn: typeof fetch): Promise<ZoteroPublicationsResult> => {
	const resolved = resolveZoteroConfig();
	if (!resolved.ok) {
		return { username: resolved.username, error: resolved.error };
	}

	const { username, userId, style, locale, referenceContent } = resolved;
	const dataUrl = buildPublicationsUrl(userId, { format: 'json', include: 'data,citation,bib', style, locale });
	const sourceUrl = buildPublicationsUrl(userId, {
		format: 'bib',
		content: referenceContent,
		style,
		locale
	});

	try {
		const { items, lastResponse } = await fetchAllPages(dataUrl, fetchFn);
		const primaryItems = items.filter(isPrimaryPublication).toSorted(byParsedDateDesc);
		const tagsByKey = await fetchTagsByKeys(
			userId,
			primaryItems.map((item) => item.key),
			fetchFn
		);
		const publications = primaryItems
			.map((item) => toPublication(item, tagsByKey.get(item.key), referenceContent))
			.filter((publication): publication is ZoteroPublication => publication !== null);

		return {
			username,
			userId,
			displayName: items[0]?.library?.name,
			publications,
			sourceUrl,
			updatedAt: lastResponse?.headers.get('last-modified') ?? lastResponse?.headers.get('date') ?? undefined
		};
	} catch (caught) {
		const message = caught instanceof Error ? caught.message : 'Unknown error';
		return {
			username,
			error: `Error while fetching Zotero publications: ${message}`
		};
	}
};

export const loadZoteroTaggedPublications = async (fetchFn: typeof fetch): Promise<TaggedPublication[]> => {
	const result = await loadZoteroPublications(fetchFn);
	if (result.error || !result.publications) {
		return [];
	}

	return result.publications.map((publication) => ({
		title: publication.title,
		formattedCitation: publication.formattedCitation,
		tags: publication.tags ?? [],
		zoteroUrl: publication.zoteroUrl,
		date: publication.date,
		parsedDate: publication.parsedDate
	}));
};

const resolveZoteroConfig = (): ResolvedZoteroConfig => {
	const zoteroProfile = findZoteroProfile();
	const username = (zoteroProfile?.zoteroUsername || '').trim();
	if (!username) {
		return {
			ok: false,
			username: '',
			error: 'Zotero username is not configured in src/lib/config.ts (authorProfiles.*.zoteroUsername)'
		};
	}

	const userId = toNumber(zoteroProfile?.zoteroUserId);
	if (!userId) {
		return {
			ok: false,
			username,
			error: 'Zotero user ID is not configured in src/lib/config.ts (authorProfiles.*.zoteroUserId)'
		};
	}

	return {
		ok: true,
		username,
		userId,
		style: (config.zoteroCitationStyle || DEFAULT_STYLE).trim(),
		locale: (config.zoteroCitationLocale || DEFAULT_LOCALE).trim(),
		referenceContent: config.zoteroReferenceContent === 'citation' ? 'citation' : DEFAULT_REFERENCE_CONTENT
	};
};

const findZoteroProfile = (): (ZoteroProfileConfig & { id: string }) | null => {
	for (const [id, profile] of Object.entries(config.authorProfiles)) {
		if (profile.zoteroUsername && profile.zoteroUserId) {
			return {
				id,
				zoteroUsername: profile.zoteroUsername,
				zoteroUserId: profile.zoteroUserId
			};
		}
	}

	return null;
};

const buildPublicationsUrl = (
	userId: number,
	options?: {
		format?: 'json' | 'bib';
		style?: string;
		locale?: string;
		include?: string;
		content?: ReferenceContent;
		limit?: number;
		sort?: string;
		direction?: 'asc' | 'desc';
	}
): string => {
	const format = options?.format || 'json';
	const params = new URLSearchParams({
		format,
		limit: String(options?.limit ?? DEFAULT_LIMIT),
		sort: options?.sort || 'date',
		direction: options?.direction || 'desc'
	});

	if (format === 'json') {
		params.set('include', options?.include || 'data,citation,bib');
	} else {
		params.set('content', options?.content || 'bib');
	}

	if (options?.style) params.set('style', options.style);
	if (options?.locale) params.set('locale', options.locale);

	return `${ZOTERO_API_BASE}/users/${userId}/publications/items?${params.toString()}`;
};

const fetchAllPages = async (
	initialUrl: string,
	fetchFn: typeof fetch
): Promise<{ items: ZoteroItem[]; lastResponse: Response | null }> => {
	const items: ZoteroItem[] = [];
	let nextUrl: string | null = initialUrl;
	let lastResponse: Response | null = null;

	while (nextUrl) {
		const response = await fetchFn(nextUrl);
		if (!response.ok) {
			throw new Error(`Failed to fetch Zotero publications: ${response.status} ${response.statusText}`);
		}

		lastResponse = response;
		items.push(...((await response.json()) as ZoteroItem[]));
		nextUrl = getNextPageUrl(response.headers.get('link'));
	}

	return { items, lastResponse };
};

const fetchTagsByKeys = async (
	userId: number,
	keys: string[],
	fetchFn: typeof fetch
): Promise<Map<string, string[]>> => {
	const cleanKeys = Array.from(new Set(keys.filter(Boolean)));
	if (cleanKeys.length === 0) {
		return new Map();
	}

	const batches = chunk(cleanKeys, ITEM_KEY_BATCH_SIZE);
	const itemBatches = await Promise.all(
		batches.map(async (batchKeys) => {
			const response = await fetchFn(buildItemsByKeyUrl(userId, batchKeys));
			if (!response.ok) {
				throw new Error(`Failed to fetch Zotero item tags: ${response.status} ${response.statusText}`);
			}

			return (await response.json()) as ZoteroItem[];
		})
	);

	const tagsByKey = new Map<string, string[]>();
	for (const item of itemBatches.flat()) {
		tagsByKey.set(item.key, toTags(item.data?.tags));
	}

	return tagsByKey;
};

const toPublication = (
	item: ZoteroItem,
	tagsFromItemsEndpoint?: string[],
	referenceContent: ReferenceContent = 'bib'
): ZoteroPublication | null => {
	const data = item.data ?? {};
	const title = asString(data.title);
	if (!title) return null;

	const publicationTitle = [data.publicationTitle, data.bookTitle, data.proceedingsTitle, data.websiteTitle]
		.map(asString)
		.find(Boolean);

	const formattedReference = resolveReference(item, referenceContent);

	return {
		key: item.key,
		title,
		itemType: asString(data.itemType) || 'document',
		abstractNote: asString(data.abstractNote),
		formattedCitation: formattedReference,
		date: asString(data.date),
		parsedDate: asString(item.meta?.parsedDate),
		creators: toCreators(data.creators),
		tags: tagsFromItemsEndpoint ?? toTags(data.tags),
		detailFields: toDetailFields(item),
		publisher: asString(data.publisher),
		university: asString(data.university),
		institution: asString(data.institution),
		websiteTitle: asString(data.websiteTitle),
		journalAbbreviation: asString(data.journalAbbreviation),
		publicationTitle,
		url: asString(data.url),
		doi: asString(data.DOI),
		zoteroUrl: asString(item.links?.alternate?.href)
	};
};

const toDetailFields = (item: ZoteroItem): ZoteroDetailField[] => {
	return Object.entries({
		key: item.key,
		bib: item.bib,
		citation: item.citation,
		parsedDate: item.meta?.parsedDate,
		meta: item.meta,
		links: item.links,
		...(item.data ?? {})
	})
		.filter(([key]) => !EXCLUDED_DETAIL_FIELDS.has(key))
		.map(([key, value]) => ({ key, value: formatDetailValue(item, key, value) }))
		.filter(({ value }) => Boolean(value))
		.sort((a, b) => compareDetailFieldOrder(a.key, b.key));
};

const compareDetailFieldOrder = (a: string, b: string): number => {
	const aOrder = PRIORITY_INDEX.get(a as (typeof PRIORITY_DETAIL_FIELDS)[number]);
	const bOrder = PRIORITY_INDEX.get(b as (typeof PRIORITY_DETAIL_FIELDS)[number]);

	if (aOrder !== undefined || bOrder !== undefined) {
		return (aOrder ?? Number.MAX_SAFE_INTEGER) - (bOrder ?? Number.MAX_SAFE_INTEGER);
	}

	return a.localeCompare(b);
};

const formatDetailValue = (item: ZoteroItem, key: string, value: unknown): string => {
	if (value === null || value === undefined) return '';
	if (typeof value === 'string') {
		if (key === 'DOI') {
			return linkDoi(value);
		}

		if (key === 'url') {
			return linkUrl(value);
		}

		if (key === 'bib' || key === 'citation') {
			return enrichWithAnchors(key, value, item) || '';
		}

		return String(value);
	}

	if (Array.isArray(value)) {
		return value.map(formatDetailItem).filter(Boolean).join('; ');
	}
	if (typeof value === 'object') return JSON.stringify(value);
	return String(value);
};

const resolveReference = (
	item: ZoteroItem,
	referenceContent: ReferenceContent
): string | undefined => {
	if (referenceContent === 'citation') {
		const citation = asString(item.citation) || asString(item.data?.citation);
		if (citation) return enrichWithAnchors('citation', citation, item);

		const bib = asString(item.bib);
		return enrichWithAnchors('bib', bib, item);
	}

	const bib = asString(item.bib);
	if (bib) return enrichWithAnchors('bib', bib, item);

	const citation = asString(item.citation) || asString(item.data?.citation);
	return enrichWithAnchors('citation', citation, item);
};

const enrichWithAnchors = (
	kind: 'bib' | 'citation',
	value: string | undefined,
	item: ZoteroItem
): string | undefined => {
	if (!value || kind === 'citation' || ANCHOR_PATTERN.test(value)) {
		return value;
	}

	const doi = asString(item.data?.DOI)?.trim();
	const url = asString(item.data?.url)?.trim();

	let withDoi = value;
	if (doi) {
		const doiUrl = `https://doi.org/${doi}`;
		withDoi = value.includes(doiUrl)
			? value.replaceAll(doiUrl, toReferenceAnchor(doiUrl, doi))
			: replaceReferenceValue(value, doi, doiUrl);
	}

	return replaceReferenceValue(withDoi, url, url);
};

const replaceReferenceValue = (
	value: string,
	text: string | undefined,
	href: string | undefined
): string => {
	if (!text || !href || !value.includes(text)) {
		return value;
	}

	return value.replaceAll(text, toReferenceAnchor(href, text));
};

const toReferenceAnchor = (href: string, label: string): string =>
	`<a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a>`;

const linkUrl = (value: string): string =>
	value.startsWith('http') ? toReferenceAnchor(value, value) : value;

const linkDoi = (value: string): string =>
	value ? toReferenceAnchor(`https://doi.org/${value}`, value) : value;

const formatDetailItem = (value: unknown): string => {
	if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
		return String(value);
	}

	if (typeof value === 'object' && value !== null && 'tag' in value && typeof value.tag === 'string') {
		return value.tag;
	}

	return typeof value === 'object' && value !== null ? JSON.stringify(value) : '';
};

const toCreator = (value: unknown): ZoteroCreator | null => {
	if (typeof value !== 'object' || value === null) return null;

	const record = value as {
		creatorType?: unknown;
		name?: unknown;
		firstName?: unknown;
		lastName?: unknown;
	};

	const creator = {
		creatorType: asString(record.creatorType),
		name: asString(record.name),
		firstName: asString(record.firstName),
		lastName: asString(record.lastName)
	};

	return Object.values(creator).some(Boolean) ? creator : null;
};

const toCreators = (creators: unknown): ZoteroCreator[] => {
	if (!Array.isArray(creators)) return [];
	return creators.map(toCreator).filter((creator): creator is ZoteroCreator => creator !== null);
};

const toTags = (tags: unknown): string[] => {
	if (!Array.isArray(tags)) return [];

	const unique = new Set<string>();
	for (const tag of tags) {
		const value =
			typeof tag === 'string'
				? tag
				: typeof tag === 'object' && tag !== null && 'tag' in tag && typeof tag.tag === 'string'
					? tag.tag
					: undefined;

		if (value?.trim()) {
			unique.add(value.trim());
		}
	}

	return Array.from(unique);
};

const isPrimaryPublication = (item: ZoteroItem): boolean => {
	const itemType = asString(item.data?.itemType);
	const title = asString(item.data?.title);
	const isChild = Boolean(item.data?.parentItem);
	return !isChild && itemType !== 'attachment' && itemType !== 'note' && Boolean(title);
};

const byParsedDateDesc = (a: ZoteroItem, b: ZoteroItem): number =>
	toTimestamp(b.meta?.parsedDate) - toTimestamp(a.meta?.parsedDate);

const asString = (value: unknown): string | undefined =>
	typeof value === 'string' ? value : undefined;

const toNumber = (value: unknown): number | null => {
	if (typeof value === 'number' && Number.isFinite(value)) return value;
	if (typeof value !== 'string' || !value.trim()) return null;
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : null;
};

const toTimestamp = (date: unknown): number => {
	if (typeof date !== 'string' || !date) return 0;
	const timestamp = Date.parse(`${date}T00:00:00Z`);
	return Number.isNaN(timestamp) ? 0 : timestamp;
};

const getNextPageUrl = (linkHeader: string | null): string | null => {
	if (!linkHeader) return null;

	for (const link of linkHeader.split(',').map((entry) => entry.trim())) {
		const match = link.match(/<([^>]+)>;\s*rel="([^"]+)"/);
		if (match?.[1] && match?.[2] === 'next') {
			return match[1];
		}
	}

	return null;
};

const buildItemsByKeyUrl = (userId: number, keys: string[]): string => {
	const params = new URLSearchParams({
		format: 'json',
		include: 'data',
		itemKey: keys.join(',')
	});

	return `${ZOTERO_API_BASE}/users/${userId}/items?${params.toString()}`;
};

const chunk = <T>(values: T[], size: number): T[][] => {
	const result: T[][] = [];
	for (let index = 0; index < values.length; index += size) {
		result.push(values.slice(index, index + size));
	}
	return result;
};
