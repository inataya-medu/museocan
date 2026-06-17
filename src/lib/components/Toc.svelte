<script lang="ts">
	type Props = { headings?: Heading[]; label?: string; maxDepth?: 2 | 3 };

	let { headings = [], label = 'Table des matières', maxDepth = 2 }: Props = $props();

	const visible = $derived(headings.filter((h) => h.depth <= maxDepth));
</script>

{#if visible.length > 0}
	<nav aria-label={label}>
		<ul>
			{#each visible as h (h.id)}
				<li class:sub={h.depth === 3}>
					<a href="#{h.id}">{h.text}</a>
				</li>
			{/each}
		</ul>
	</nav>
{/if}

<style>
	nav {
		margin-bottom: 2rem;
	}

	ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	li {
		margin: 0.25rem 0;
	}

	li.sub {
		padding-left: 1.25rem;
	}
</style>
