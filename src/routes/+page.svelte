<script lang="ts">
	import * as config from '$lib/config';
</script>

<svelte:head>
	<title>{config.siteTitle}</title>
	<meta name="description" content={config.siteDescription} />
</svelte:head>

<header>
	<h1>Welcome to Ouvroir’s Blog template</h1>
	<p>Visit <a href="https://github.com/ouvroir/blog-template">ouvroir/blog-template</a> for more information about this project.</p>
	<p>This template uses SvelteKit. See the <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> documentation.</p>
</header>
