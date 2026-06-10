const isStringArray = (value: unknown): value is string[] =>
	Array.isArray(value) && value.every((item) => typeof item === 'string');

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

const isBlogAuthorInput = (value: unknown): value is BlogAuthorInput =>
	typeof value === 'string' || isBlogAuthorObject(value);

export const isPost = (value: Partial<Posts>): value is Posts => {
	const hasValidAuthor =
		typeof value.author === 'undefined' ||
		isBlogAuthorInput(value.author) ||
		(Array.isArray(value.author) && value.author.every((item) => isBlogAuthorInput(item)));

	const hasValidTags =
		typeof value.tags === 'undefined' ||
		typeof value.tags === 'string' ||
		isStringArray(value.tags);

	return (
		(typeof value.slug === 'undefined' || typeof value.slug === 'string') &&
		typeof value.title === 'string' &&
		hasValidAuthor &&
		typeof value.description === 'string' &&
		(typeof value.date === 'string' || value.date instanceof Date) &&
		typeof value.published === 'boolean' &&
		hasValidTags
	);
};
