export interface ReadingTimeOptions {
	wordsPerMinute?: number;
	minimumMinutes?: number;
	rounding?: 'ceil' | 'round' | 'floor';
}

export interface ReadingTimeEstimate {
	words: number;
	minutes: number;
}

const DEFAULT_WORDS_PER_MINUTE = 200;
const DEFAULT_MINIMUM_MINUTES = 1;

export const countWords = (text: string): number => {
	const normalized = text.replace(/\s+/g, ' ').trim();
	if (!normalized) {
		return 0;
	}

	return normalized.split(' ').length;
};

export const estimateReadingTime = (
	text: string,
	{
		wordsPerMinute = DEFAULT_WORDS_PER_MINUTE,
		minimumMinutes = DEFAULT_MINIMUM_MINUTES,
		rounding = 'ceil'
	}: ReadingTimeOptions = {}
): ReadingTimeEstimate => {
	const words = countWords(text);
	if (!words) {
		return { words: 0, minutes: 0 };
	}

	const rawMinutes = words / Math.max(wordsPerMinute, 1);
	const roundedMinutes =
		rounding === 'floor' ? Math.floor(rawMinutes) : rounding === 'round' ? Math.round(rawMinutes) : Math.ceil(rawMinutes);

	return {
		words,
		minutes: Math.max(minimumMinutes, roundedMinutes)
	};
};

export const getReadingTime = (text: string, options: ReadingTimeOptions = {}): number => {
	const { minutes } = estimateReadingTime(text, options);
	return minutes;
};

export const formatReadingTime = (minutes: number): string => {
	if (minutes <= 0) {
		return '';
	}

	const value = new Intl.NumberFormat('fr-FR').format(minutes);
	return `${value} min de lecture`;
};