import { mdsvex } from 'mdsvex';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeSlug from 'rehype-slug';
import remarkFootnotes from 'remark-footnotes';
import remarkGfm from 'remark-gfm';
import remarkSupersub from 'remark-supersub';
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
  preprocess: [
    vitePreprocess(),
    mdsvex({
      // The default mdsvex extension is .svx; this overrides that.
      extensions: ['.md', '.svx'],

      // Footnotes support via remark-footnotes (v2, compatible with mdsvex)
      // GFM for tables, strikethrough, etc.
      remarkPlugins: [remarkFootnotes, remarkGfm, remarkSupersub],

      // Adds IDs to headings, then injects anchor links for those IDs.
      rehypePlugins: [
        rehypeSlug,
        [
          rehypeAutolinkHeadings,
          {
            behavior: 'append',
            properties: {
              className: ['heading-anchor']
            },
            content: {
              type: 'text',
              value: ' #'
            }
          }
        ]
      ]
    })
  ],
  kit: {
    adapter: adapter(),
    paths: {
      base: process.env.BASE_PATH ?? ''
    }
  },
	extensions: ['.svelte', '.svx', '.md']
};

export default config;
