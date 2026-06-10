const ORCID_API_BASE = 'https://pub.orcid.org/v3.0';
const ORCID_TOKEN_URL = 'https://orcid.org/oauth/token';
const WORKS_LIMIT = 10;

// Public API
export const loadOrcidProfile = async (
	orcidId: string,
	clientId?: string,
	clientSecret?: string
): Promise<OrcidProfile> => {
	if (!orcidId) {
		return { error: 'Identifiant ORCID non fourni' };
	}

	try {
		const accessToken =
			clientId && clientSecret ? await fetchAccessToken(clientId, clientSecret) : null;

		const headers: Record<string, string> = { Accept: 'application/json' };
		if (accessToken) {
			headers['Authorization'] = `Bearer ${accessToken}`;
		} else {
			console.warn('Utilisation de l\'API ORCID sans authentification');
		}

		const response = await fetch(`${ORCID_API_BASE}/${orcidId}`, { headers });

		if (!response.ok) {
			return { error: `Impossible de récupérer le profil ORCID: ${response.statusText}` };
		}

		const data = await response.json();

		return {
			name: extractName(data),
			biography: extractBiography(data),
			email: extractEmail(data),
			affiliations: extractAffiliations(data),
			works: extractWorks(data),
			urls: extractUrls(data)
		};
	} catch (error) {
		return {
			error: error instanceof Error ? error.message : 'Erreur inconnue lors de la récupération du profil ORCID'
		};
	}
};

// Auth helpers
const fetchAccessToken = async (clientId: string, clientSecret: string): Promise<string | null> => {
	try {
		const credentials = btoa(`${clientId}:${clientSecret}`);
		const response = await fetch(ORCID_TOKEN_URL, {
			method: 'POST',
			headers: {
				Authorization: `Basic ${credentials}`,
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: 'grant_type=client_credentials&scope=/read-public'
		});

		if (!response.ok) {
			console.error('Impossible d\'obtenir le jeton d\'accès ORCID:', response.statusText);
			return null;
		}

		const data = await response.json();
		return data.access_token ?? null;
	} catch (error) {
		console.error('Erreur lors de la récupération du jeton ORCID:', error);
		return null;
	}
};

// Extraction helpers

function extractName(data: unknown): string | undefined {
	const d = data as Record<string, unknown>;
	const name = (d?.person as Record<string, unknown>)?.['name'] as Record<string, unknown>;
	const given = readText((name?.['given-names'] as Record<string, unknown>)?.['value']);
	const family = readText((name?.['family-name'] as Record<string, unknown>)?.['value']);
	return given && family ? `${given} ${family}` : undefined;
}

function extractBiography(data: unknown): string | undefined {
	const bio = ((data as Record<string, unknown>)?.person as Record<string, unknown>)?.['biography'] as
		| Record<string, unknown>
		| undefined;
	return (
		(bio?.['content'] as string | undefined) ??
		((bio?.['biography'] as Record<string, unknown>)?.['value'] as string | undefined)
	);
}

function extractEmail(data: unknown): string | undefined {
	const emails = (((data as Record<string, unknown>)?.person as Record<string, unknown>)?.['emails'] as Record<
		string,
		unknown
	>)?.['email'] as Array<Record<string, unknown>> | undefined;
	return (emails?.[0]?.['email'] as Record<string, unknown>)?.['value'] as string | undefined;
}

function extractAffiliations(data: unknown): OrcidAffiliation[] {
	const groups = (((((data as Record<string, unknown>)?.['activities-summary'] as Record<string, unknown>)?.[
		'employments'
	] as Record<string, unknown>)?.['affiliation-group']) as Array<Record<string, unknown>> | undefined);

	if (!Array.isArray(groups)) return [];

	const affiliations: OrcidAffiliation[] = [];

	for (const group of groups) {
		const summaries = group?.['summaries'] as Array<Record<string, unknown>> | undefined;
		if (!Array.isArray(summaries)) continue;
		for (const summary of summaries) {
			const emp = summary?.['employment-summary'] as Record<string, unknown> | undefined;
			if (!emp) continue;

			const roleTitle = readText(emp?.['role-title']);
			const departmentName = readText(emp?.['department-name']);
			const organization = readText((emp?.['organization'] as Record<string, unknown>)?.['name']);
			const startYear =
				readText(((emp?.['start-date'] as Record<string, unknown>)?.['year'] as Record<string, unknown>)?.['value']) ||
				readText((emp?.['start-date'] as Record<string, unknown>)?.['year']);
			const endYear =
				readText(((emp?.['end-date'] as Record<string, unknown>)?.['year'] as Record<string, unknown>)?.['value']) ||
				readText((emp?.['end-date'] as Record<string, unknown>)?.['year']);

			affiliations.push({
				title: roleTitle || departmentName,
				organization,
				startDate: startYear,
				endDate: endYear
			});
		}
	}

	return affiliations
		.filter((affiliation) => Boolean(affiliation.title || affiliation.organization))
		.sort((a, b) => parseInt(b.startDate ?? '0') - parseInt(a.startDate ?? '0'));
}

function extractWorks(data: unknown): OrcidWork[] {
	const groups = (((data as Record<string, unknown>)?.['activities-summary'] as Record<string, unknown>)?.[
		'works'
	] as Record<string, unknown>)?.['group'] as Array<Record<string, unknown>> | undefined;

	if (!Array.isArray(groups)) return [];

	const works: OrcidWork[] = [];

	for (const group of groups) {
		const summaries = group?.['work-summary'] as Array<Record<string, unknown>> | undefined;
		if (!Array.isArray(summaries) || summaries.length === 0) continue;
		const work = summaries[0];
		const titleRecord = (work?.['title'] as Record<string, unknown>)?.['title'];
		const publicationDate = work?.['publication-date'] as Record<string, unknown> | undefined;
		const year =
			readText((publicationDate?.['year'] as Record<string, unknown>)?.['value']) ||
			readText(publicationDate?.['year']);
		const month =
			readText((publicationDate?.['month'] as Record<string, unknown>)?.['value']) ||
			readText(publicationDate?.['month']);
		const day =
			readText((publicationDate?.['day'] as Record<string, unknown>)?.['value']) ||
			readText(publicationDate?.['day']);
		const date = [year, month, day].filter(Boolean).join('-') || year;

		works.push({
			title: readText((titleRecord as Record<string, unknown>)?.['value']) || readText(titleRecord),
			type: readText(work?.['type']),
			date,
			url: readText((work?.['url'] as Record<string, unknown>)?.['value']) || readText(work?.['url']),
			doi: extractDoi(work)
		});
	}

	return works
		.filter((w) => w.title)
		.sort((a, b) => parseInt(b.date ?? '0') - parseInt(a.date ?? '0'))
		.slice(0, WORKS_LIMIT);
}

function extractDoi(work: Record<string, unknown>): string | undefined {
	const ids = (work?.['external-ids'] as Record<string, unknown>)?.['external-id'] as
		| Array<Record<string, unknown>>
		| undefined;
	const doiCandidate = ids?.find((id) => id['external-id-type'] === 'doi')?.['external-id-value'];
	return readText((doiCandidate as Record<string, unknown>)?.['value']) || readText(doiCandidate);
}

function readText(value: unknown): string | undefined {
	return typeof value === 'string' && value.trim() ? value : undefined;
}

function extractUrls(data: unknown): OrcidUrl[] {
	const urls = ((data as Record<string, unknown>)?.['person'] as Record<string, unknown>)?.[
		'researcher-urls'
	] as Record<string, unknown> | undefined;
	const list = urls?.['researcher-url'] as Array<Record<string, unknown>> | undefined;

	if (!Array.isArray(list)) return [];

	return list.map((url) => ({
		name: url?.['url-name'] as string | undefined,
		url: (url?.['url'] as Record<string, unknown>)?.['value'] as string | undefined
	}));
}
