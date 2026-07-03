# Déploiement temporaire — Netlify

Guide pour publier CFM ASBL sur **Netlify** (preview / démo temporaire).

> **Important** : Netlify utilise des **fonctions serverless** avec un disque **non persistant**.
> Les formulaires, admin et chat **ne conservent pas les données** entre les requêtes.
> Ce déploiement convient pour une **démo visuelle** du site, pas pour la production V4.

---

## Ce qui fonctionne sur Netlify

| Fonctionnalité | Statut |
|----------------|--------|
| Pages publiques (accueil, à propos, axes…) | OK |
| Design, animations, i18n | OK |
| Images / médias (`public/media/`) | OK |
| Navigation, live replay (YouTube) | OK |
| HTTPS automatique | OK |
| Admin connexion (session cookie) | OK (session par visiteur) |

## Limitations (démo temporaire)

| Fonctionnalité | Statut |
|----------------|--------|
| Formulaires (contact, adhésion, aide) | Écriture **non persistante** |
| Admin — modifications contenu | **Perdues** au redémarrage |
| Chat live, sondages, push | **Non fiables** |
| Upload médias admin | **Non persistant** |
| Comptes membres / dons | **Non persistant** |

Pour la production réelle → VPS + PostgreSQL (voir `PLAN.md` V4).

---

## Prérequis

- Compte [Netlify](https://app.netlify.com)
- Dépôt Git (GitHub, GitLab ou Bitbucket)
- Node.js 20 en local pour tester

---

## Fichiers ajoutés pour Netlify

| Fichier | Rôle |
|---------|------|
| `netlify.toml` | Commande build, Node 20, headers PWA |
| `data/store.seed.json` | Données de démo versionnées (sans données test) |
| `scripts/prepare-netlify.mjs` | Copie seed → `store.json` avant build |
| `.nvmrc` | Node 20 |

---

## Étape 1 — Vérifier en local

```bash
npm install
npm run build:netlify
```

Si OK :

```bash
npm run start
# → http://localhost:3000
```

Vérification complète :

```bash
npm run predeploy:netlify
```

---

## Étape 2 — Pousser sur Git

```bash
git add netlify.toml data/store.seed.json scripts/ public/media/
git commit -m "Prepare Netlify temporary deployment"
git push
```

**Ne pas committer** : `.env.local`, `data/store.json`

---

## Étape 3 — Créer le site Netlify

1. [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import an existing project**
2. Connecter votre dépôt Git
3. Netlify détecte Next.js automatiquement :
   - **Build command** : `npm run build:netlify` (déjà dans `netlify.toml`)
   - **Publish** : laisser Netlify / OpenNext gérer (ne pas modifier)
4. **Deploy site**

---

## Étape 4 — Variables d'environnement

Dans **Site settings → Environment variables** :

| Variable | Valeur | Obligatoire |
|----------|--------|-------------|
| `ADMIN_PASSWORD` | Mot de passe fort (admin) | Oui |
| `SESSION_SECRET` | Chaîne aléatoire 32+ caractères | Oui |
| `NEXT_PUBLIC_SITE_URL` | `https://votre-site.netlify.app` | Oui |
| `NODE_ENV` | `production` | Auto |
| `MOBILE_MONEY_MODE` | `demo` | Recommandé |
| `CFM_DEMO_READONLY` | `true` | Optionnel (message démo) |

Générer un secret :

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Push / VAPID** (optionnel pour démo) :

```bash
node scripts/generate-vapid.mjs
```

Puis ajouter `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`.

---

## Étape 5 — Redéployer

Après avoir ajouté les variables :

**Deploys → Trigger deploy → Deploy site**

Votre URL temporaire : `https://<nom>.netlify.app`

---

## Domaine personnalisé (optionnel)

**Domain management → Add domain** → `cfmasbl.com`

Mettre à jour `NEXT_PUBLIC_SITE_URL` avec l'URL finale.

---

## Mettre à jour les données de démo

1. Modifier `data/store.seed.json` (contenu public uniquement)
2. Commit + push → Netlify rebuild automatiquement

Pour inclure vos données locales (attention données sensibles) :

```bash
# Local uniquement — ne pas committer store.json avec données réelles
cp data/store.json data/store.seed.json
# Puis nettoyer memberships, help_requests, users avant commit
```

---

## Dépannage

| Problème | Solution |
|----------|----------|
| Build échoue | `npm run build:netlify` en local, lire les logs |
| Admin ne connecte pas | Vérifier `ADMIN_PASSWORD` + redéployer |
| Images manquantes | Vérifier `public/media/` versionné |
| Formulaire « réussit » mais rien en admin | Normal sur Netlify (non persistant) |
| PWA / push ne marche pas | HTTPS OK sur Netlify ; VAPID requis pour push |

---

## Passer à la production (V4)

Quand la démo est validée :

1. VPS Linux + PostgreSQL
2. PM2 + Nginx + Let's Encrypt
3. Migration `store.json` → PostgreSQL

Voir `PLAN.md` section 21 (V4).

---

*CFM ASBL — Déploiement Netlify temporaire*
