---
title: "A Markdown post with a Svelte component"
date: 2023-04-28
author: "emchateau"
description: "Test description"
tags:
  - mdsvex
  - svelte
slug: test-de-slug
published: true
---

# A Markdown post with a Svelte component

<script>
	import Counter from '$lib/components/Counter.svelte';
</script>

This starter includes an `Callout.svelte` component. It's not particularly useful on its own, but here's how you might use it inside of a Markdown post, thanks to mdsvex.

<Counter />

You can inject any Svelte components you want into Markdown! Just import them in a `<script>` tag and then use them wherever you like.

For that matter, you can inject any HTML anywhere! (Note that you cannot use Markdown _inside_ Svelte components or HTML, however. Any opened tag must be closed before returning to Markdown.)