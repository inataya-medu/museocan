<script lang="ts">
	import { page } from '$app/state';
	import { browser } from '$app/environment';

	import * as config from '$lib/config';
	
	const online = browser ? navigator.onLine : true;
</script>

<svelte:head>
	<title>{page.status} | {config.siteTitle}</title>
	<meta name="description" content={`Erreur ${page.status}`} />
	<meta name="robots" content="noindex" />
</svelte:head>

<article class="page">
	{#if online}
		{#if page.status === 404}
			<h1>Cette page est introuvable ({page.status})</h1>
			{#if page.error?.message}
			<p><strong>{page.error.message}</strong></p>
			{/if}
			<p>
				Si vous cherchiez quelque chose en particulier à cette adresse, laissez une issue sur <a
					href="https://github.com/ouvroir/blog-template/issues">GitHub</a
				>. Merci&nbsp;!
			</p>
		{:else}
			<h1>Oups&nbsp;! ({page.status})</h1>
			{#if page.error?.message}
			<p><strong>{page.error.message}</strong></p>
			{/if}
			<p>Quelque chose n’a pas fonctionné lorsque nous avons essayé d’afficher cette page. Essayez de recharger la page, s’il vous plaît.</p>
			<p>Si l’erreur persiste, faites-nous le savoir en déposant une issue sur <a href="https://github.com/ouvroir/blog-template/issues">GitHub</a>. Merci&nbsp;!</p>
		{/if}
	{:else}
		<h1>Il semble que vous soyez hors-ligne</h1>
		<p>Rechargez la page quand vous avez trouvé une connexion.</p>
	{/if}
</article>
