# Configuration des variables d’environnement

La page de CV utilise l’API ORCID. La récupération des des données nécessite une authentification sur l’API ORCID.

### 1. Obtenir vos credentials ORCID

1. Visitez https://orcid.org/developer-tools
2. Enregistrez votre application
3. Notez votre `Client ID` et `Client Secret`

### 2. Configurer les variables d’environnement

1. Copiez le fichier `.env.example` vers `.env` :
   ```bash
   cp .env.example .env
   ```

2. Éditez `.env` et remplacez les placeholders par vos credentials :
   ```
   ORCID_CLIENT_ID=APP-XXXXXXXXXXXXXXXXXX
   ORCID_CLIENT_SECRET=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   ```

3. **Important** : Ne commitez **JAMAIS** le fichier `.env` dans Git !

Par sécurité : 
- Les credentials sont stockés dans `.env` (le répertoire est déjà déclaré dans `.gitignore`)  
- Les credentials sont utilisés uniquement côté serveur (`+page.server.ts`) 
- Les credentials ne sont JAMAIS exposés au client  
- Un fichier `.env.example` sert de template

### 3. Redémarrer le serveur

Après avoir configuré `.env`, redémarrez votre serveur de développement :

```bash
npm run dev
```

### Fonctionnement

- **Avec credentials** : L’API ORCID sera appelée avec authentification OAuth2, permettant un rate limiting plus élevé
- **Sans credentials** : L’application utilisera l'API publique non authentifiée (rate-limited)