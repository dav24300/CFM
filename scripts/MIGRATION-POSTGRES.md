# Migration store.json → PostgreSQL

## Prérequis

- PostgreSQL 15+
- Node.js 20+
- Fichier `data/store.json` à jour

## Étapes

1. Créer la base et l'utilisateur :

```bash
sudo -u postgres psql -c "CREATE USER cfm WITH PASSWORD 'votre_mot_de_passe';"
sudo -u postgres psql -c "CREATE DATABASE cfm OWNER cfm;"
```

2. Appliquer le schéma :

```bash
psql -U cfm -d cfm -f scripts/schema.sql
```

3. Exporter les données JSON (exemple avec `jq` + scripts manuels) :

Les tables V1 (`news`, `studies`, etc.) restent en JSON jusqu'à la V3.
Pour V2, importer manuellement ou via un script Node :

```bash
node scripts/import-to-postgres.mjs
```

> Le script `import-to-postgres.mjs` est un gabarit : configurez `DATABASE_URL` dans `.env` avant exécution.

4. Variables d'environnement production :

```
DATABASE_URL=postgresql://cfm:mot_de_passe@localhost:5432/cfm
```

5. Bascule applicative (V3) : remplacer `lib/store.ts` par un adaptateur PostgreSQL.

## Vérification

```sql
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM petitions;
SELECT COUNT(*) FROM donations;
```

Les comptes doivent correspondre aux entrées de `store.json`.
