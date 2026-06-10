---
title: À propos
description: En savoir plus sur le blog template d’Ouvroir
slug: testo
---

<script>
	import Counter from '$lib/components/Counter.svelte';
</script>

# À propos

Cette page est rédigée en Markdown avec des métadonnées dans le bloc `metadata` YAML.

Le bloc `metadata` permet de définir :
- Le titre de la page (pour le SEO)
- La description (pour les moteurs de recherche)
- D'autres métadonnées selon les besoins

## Utilisation de composants Svelte

Avec mdsvex et le layout global configuré dans `svelte.config.js`, tous les fichiers `.md` dans `routes/` bénéficient automatiquement :
- Du traitement du SEO à partir des metadata (title, description)
- Du canonical URL hérité du layout racine
- De la possibilité d'utiliser des composants Svelte

<Counter />

Créez simplement un fichier `.md` avec des metadata, et le layout global s'occupe du reste !
