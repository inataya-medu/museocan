---
title: "mdsvex plugins: heading anchors, superscript, and footnotes"
date: 2026-03-07
author: ["emchateau", "ouvroir"]
description: "Example post showing heading anchors, superscript/subscript, and footnotes with mdsvex plugins."
tags:
  - mdsvex
  - rehype
  - remark
published: true
---

# mdsvex Plugins Example test^2^

This post demonstrates the plugins configured in `svelte.config.js`.

## Quick navigation

- [Jump to Anchors section](#anchors-on-headings)
- [Jump to Superscript and Subscript](#superscript-and-subscript)
- [Jump to Footnotes](#footnotes)

## Anchors on Headings

When `rehype-slug` is enabled, headings receive an `id` automatically.
When `rehype-autolink-headings` is enabled, an anchor link is injected in each heading.

### Nested heading example

You can link to this section with `#nested-heading-example`.

## Superscript and Subscript

With `remark-supersub`:

- Superscript: Einstein wrote E = mc^2^.
- Subscript: Water is H~2~O.

## Footnotes

With `remark-gfm`, you can use footnotes like this[^1].

You can also add another one here[^2].

[^1]: This is the first footnote.
[^2]: This is the second footnote with **Markdown formatting**.
