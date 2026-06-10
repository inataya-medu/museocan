import { resolve } from '$app/paths';

type AuthorProfile = {
	slug: string;
	name?: string;
	href?: string;
};

export type AuthorDirectory = Record<string, AuthorProfile>;

export type AuthorGroup = {
	role: string;
	label: string;
	authors: Author[];
};

type GroupAuthorsOptions = {
	roleOrder?: string[];
	roleLabels?: Record<string, string>;
	defaultRole?: string;
};

const DEFAULT_ROLE_ORDER = ['author', 'editor', 'translator', 'contributor', 'creator'];
const DEFAULT_ROLE_LABELS: Record<string, string> = {
	author: 'Auteur',
	editor: 'Éditeur',
	translator: 'Traducteur',
	contributor: 'Contributeur',
	creator: 'Créateur'
};

const normalizeString = (value: unknown): string | undefined => {
	if (typeof value !== 'string') return undefined;
	const normalized = value.trim();
	return normalized.length > 0 ? normalized : undefined;
};

const withBase = (path: string): string =>
	path.startsWith('/') ? `${resolve('/')}${path.slice(1)}` : path;

const toAuthorHref = (slug?: string, explicitHref?: string): string | undefined => {
	const normalizedHref = normalizeString(explicitHref);
	if (normalizedHref) {
		return withBase(normalizedHref);
	}

	return slug ? resolve('/auteurs/[slug]', { slug }) : undefined;
};

const isBlogAuthorObject = (value: unknown): value is BlogAuthor => {
	if (typeof value !== 'object' || value === null) return false;

	const record = value as Record<string, unknown>;

	return (
		(typeof record.id === 'undefined' || typeof record.id === 'string') &&
		(typeof record.slug === 'undefined' || typeof record.slug === 'string') &&
		(typeof record.name === 'undefined' || typeof record.name === 'string') &&
		(typeof record.href === 'undefined' || typeof record.href === 'string')
	);
};

const toUniqueAuthors = (authors: Author[]): Author[] => {
	const seen = new Set<string>();

	return authors.filter((author) => {
		const key = `${author.role || ''}|${author.id || ''}|${author.slug || ''}|${author.name}|${author.href || ''}`;
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
};

export const normalizeBlogAuthors = (
	authors: Posts['author'],
	directory: AuthorDirectory = {}
): Author[] => {
	if (!authors) return [];

	const list = Array.isArray(authors) ? authors : [authors];

	const normalized = list
		.map((author): Author | null => {
			if (typeof author === 'string') {
				const id = normalizeString(author);
				if (!id) return null;

				const profile = directory[id];
				const profileSlug = profile ? normalizeString(profile.slug) : undefined;
				return {
					id,
					slug: profileSlug,
					name: profile?.name || id,
					href: toAuthorHref(profileSlug, profile?.href)
				};
			}

			if (!isBlogAuthorObject(author)) return null;

			const id = normalizeString(author.id);
			const slug = normalizeString(author.slug);
			const profile = id ? directory[id] : undefined;
			const profileSlug = profile ? normalizeString(profile.slug) : undefined;
			const name = normalizeString(author.name) || profile?.name || id;

			if (!name) return null;

			return {
				id,
				slug: slug || profileSlug,
				name,
				href: toAuthorHref(slug || profileSlug, normalizeString(author.href) || profile?.href)
			};
		})
		.filter((author): author is Author => author !== null);

	return toUniqueAuthors(normalized);
};

type ExtendedZoteroCreator = ZoteroCreator & {
	id?: string;
	internalId?: string;
	profileId?: string;
};

const getZoteroCreatorName = (creator: ZoteroCreator): string | undefined => {
	const fullName = [normalizeString(creator.firstName), normalizeString(creator.lastName)]
		.filter(Boolean)
		.join(' ')
		.trim();

	return normalizeString(creator.name) || normalizeString(fullName);
};

const compareRole = (left: string, right: string, roleOrder: string[]): number => {
	const leftIndex = roleOrder.indexOf(left);
	const rightIndex = roleOrder.indexOf(right);

	if (leftIndex !== -1 || rightIndex !== -1) {
		return (leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex) -
			(rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex);
	}

	return left.localeCompare(right);
};

const formatRoleLabel = (role: string, count: number, roleLabels: Record<string, string>, defaultRole: string): string => {
	const singular = roleLabels[role] || roleLabels[defaultRole] || role || defaultRole;
	return count > 1 ? `${singular}s` : singular;
};

export const normalizeZoteroAuthors = (
	creators: ZoteroCreator[],
	directory: AuthorDirectory = {}
): Author[] => {
	const normalized = creators
		.map((creator): Author | null => {
			const extendedCreator = creator as ExtendedZoteroCreator;
			const id =
				normalizeString(extendedCreator.internalId) ||
				normalizeString(extendedCreator.profileId) ||
				normalizeString(extendedCreator.id);
			const profile = id ? directory[id] : undefined;
			const profileSlug = profile ? normalizeString(profile.slug) : undefined;
			const name = getZoteroCreatorName(creator) || profile?.name || id;

			if (!name) return null;

			return {
				id,
				slug: profileSlug,
				name,
				href: toAuthorHref(profileSlug, profile?.href),
				role: normalizeString(creator.creatorType) || 'creator'
			};
		})
		.filter((author): author is Author => author !== null);

	return toUniqueAuthors(normalized);
};

export const groupAuthorsByRole = (
	authors: Author[],
	options: GroupAuthorsOptions = {}
): AuthorGroup[] => {
	const roleOrder = options.roleOrder || DEFAULT_ROLE_ORDER;
	const roleLabels = options.roleLabels || DEFAULT_ROLE_LABELS;
	const defaultRole = options.defaultRole || 'creator';
	const groups = new Map<string, Author[]>();

	for (const author of authors) {
		const role = author.role || defaultRole;
		const current = groups.get(role) || [];
		current.push(author);
		groups.set(role, current);
	}

	return Array.from(groups.entries())
		.sort(([leftRole], [rightRole]) => compareRole(leftRole, rightRole, roleOrder))
		.map(([role, groupedAuthors]) => ({
			role,
			label: formatRoleLabel(role, groupedAuthors.length, roleLabels, defaultRole),
			authors: groupedAuthors
		}));
};