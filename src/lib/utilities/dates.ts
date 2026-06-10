const ISO_DATE_RE = /^\d{4}-\d{2}(-\d{2})?$/; // Accepts YYYY-MM or YYYY-MM-DD

export function isValidISODate(date: string): boolean {
	if (!ISO_DATE_RE.test(date)) return false;

	// Handle YYYY-MM-DD
	if (date.length === 10) {
		const parsed = new Date(`${date}T00:00:00Z`);
		return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
	}

	// Handle YYYY-MM (month must be 01-12)
	if (date.length === 7) {
		const month = parseInt(date.slice(5, 7), 10);
		return month >= 1 && month <= 12;
	}

	return false;
}

export const normalizePostDate = (date: string | Date): string | null => {
	if (date instanceof Date) {
		if (Number.isNaN(date.getTime())) return null;
		// Keep local date to avoid timezone shifts from YAML parsing
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	if (typeof date === 'string') {
		// Handle ISO 8601 with time (e.g. "2023-01-05T00:00:00.000Z")
		if (date.includes('T')) {
			try {
				const parsed = new Date(date);
				if (!Number.isNaN(parsed.getTime())) {
					return date.slice(0, 10); // Extract YYYY-MM-DD
				}
			} catch {
				return null;
			}
		}

		// Handle plain date formats
		if (isValidISODate(date)) {
			// Normalize YYYY-MM to YYYY-MM-01 for sorting
			if (date.length === 7) {
				return `${date}-01`;
			}
			// Keep YYYY-MM-DD unchanged
			return date;
		}

		return null;
	}

	return null;
};

export const formatDisplayDateTime = (
	value?: string,
	locale: string = 'fr-CA',
	options: Intl.DateTimeFormatOptions = { dateStyle: 'long', timeStyle: 'short' }
): string | null => {
	if (!value) {
		return null;
	}

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return null;
	}

	return new Intl.DateTimeFormat(locale, options).format(date);
};
