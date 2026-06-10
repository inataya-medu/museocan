type AnchorAttributes = Record<string, string>;

export type LinkifyRule = {
	pattern: RegExp;
	getHref: (match: string) => string | undefined;
	getLabel?: (match: string) => string;
};

export type LinkifyOptions = {
	skipIfContainsAnchor?: boolean;
	anchorAttributes?: AnchorAttributes;
};

export const urlPattern = /^https?:\/\//i;
export const urlTextPattern = /https?:\/\/[^\s<]+[^\s<.,;:)]/gi;
export const doiPattern = /^(10\.\d{4,9}\/[\w.()\-;:/]+)$/i;
export const doiTextPattern = /\b10\.\d{4,9}\/[\w.()\-;:/]+\b/gi;

const htmlTagPattern = /(<[^>]+>)/g;
const anchorPattern = /<a\b/i;
const openAnchorTagPattern = /^<a\b/i;
const closeAnchorTagPattern = /^<\/a>/i;
export const DEFAULT_ANCHOR_ATTRIBUTES: AnchorAttributes = {
	target: '_blank',
	rel: 'noopener noreferrer'
};

const toGlobalPattern = (pattern: RegExp): RegExp => {
	if (pattern.flags.includes('g')) return pattern;
	return new RegExp(pattern.source, `${pattern.flags}g`);
};

const toSinglePattern = (pattern: RegExp): RegExp => new RegExp(pattern.source, pattern.flags.replaceAll('g', ''));

const toAnchorAttributes = (options: LinkifyOptions): AnchorAttributes =>
	options.anchorAttributes ?? DEFAULT_ANCHOR_ATTRIBUTES;

const renderAttributes = (attributes: AnchorAttributes): string =>
	Object.entries(attributes)
		.map(([key, value]) => ` ${key}="${value}"`)
		.join('');

const renderAnchor = (href: string, label: string, attributes: AnchorAttributes): string =>
	`<a href="${href}"${renderAttributes(attributes)}>${label}</a>`;

const linkMatch = (match: string, rule: LinkifyRule, attributes: AnchorAttributes): string => {
	const href = rule.getHref(match);
	if (!href) return match;

	const label = rule.getLabel ? rule.getLabel(match) : match;
	return renderAnchor(href, label, attributes);
};

const replaceOutsideAnchors = (value: string, pattern: RegExp, replacer: (match: string) => string): string => {
	const parts = value.split(htmlTagPattern);
	let anchorDepth = 0;

	return parts
		.map((part) => {
			if (!part) return part;

			if (part.startsWith('<')) {
				if (openAnchorTagPattern.test(part)) {
					anchorDepth += 1;
				} else if (closeAnchorTagPattern.test(part)) {
					anchorDepth = Math.max(0, anchorDepth - 1);
				}

				return part;
			}

			if (anchorDepth > 0) {
				return part;
			}

			return part.replace(pattern, (match) => replacer(match));
		})
		.join('');
};

export const linkifyText = (
	value: string | undefined,
	rules: LinkifyRule[],
	options: LinkifyOptions = {}
): string | undefined => {
	if (!value) return value;

	if (options.skipIfContainsAnchor && anchorPattern.test(value)) {
		return value;
	}

	const anchorAttributes = toAnchorAttributes(options);

	return rules.reduce((text, rule) => {
		const pattern = toGlobalPattern(rule.pattern);
		return replaceOutsideAnchors(text, pattern, (match) => linkMatch(match, rule, anchorAttributes));
	}, value);
};

export const linkifySingleValue = (
	value: string,
	pattern: RegExp,
	getHref: (match: string) => string | undefined,
	options: LinkifyOptions = {},
	getLabel?: (match: string) => string
): string => {
	const trimmed = value.trim();
	if (!toSinglePattern(pattern).test(trimmed)) return value;

	return linkMatch(trimmed, { pattern, getHref, getLabel }, toAnchorAttributes(options));
};
