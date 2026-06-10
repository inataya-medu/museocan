<script lang="ts">
	import { asset, resolve } from '$app/paths';
	import { page } from '$app/state';
	import { navItems, siteTitle } from '$lib/config';

	type NavRoute = '/' | '/blog' | '/tags' | '/publications' | '/a-propos';

	const visibleItems = navItems.filter((item) => !item.hidden);
	let pathname = $derived(page.url.pathname);
	const withBase = (route: NavRoute) => resolve(route);
	const normalizePath = (path: string) =>
		path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
	const isCurrentRoute = (route: NavRoute) => {
		const current = normalizePath(pathname);
		const target = normalizePath(withBase(route));

		return route === '/' ? current === target : current === target || current.startsWith(`${target}/`);
	};
</script>

<nav aria-label="Navigation principale">
	<a href={withBase('/')} aria-label="Accueil">
		<img src={asset('/images/logo.svg')} alt={siteTitle} height="60" />
	</a>
	<ul>
		{#each visibleItems as item (item.route)}
			<li>
				<a
					href={withBase(item.route as NavRoute)}
					aria-current={isCurrentRoute(item.route as NavRoute) ? 'page' : undefined}
				>
					{item.title}
				</a>
			</li>
		{/each}
	</ul>
</nav>
