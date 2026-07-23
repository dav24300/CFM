-- CFM ASBL — Schéma PostgreSQL normalisé (Phase R3)
-- Exécuter : psql $DATABASE_URL -f scripts/schema.sql

-- Meta : compteurs + marqueur de sync normalisée + version des seeds one-shot
CREATE TABLE IF NOT EXISTS store_meta (
  id INTEGER PRIMARY KEY DEFAULT 1,
  counters JSONB NOT NULL DEFAULT '{"global": 100}',
  seed_version INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE store_meta ADD COLUMN IF NOT EXISTS seed_version INTEGER NOT NULL DEFAULT 0;

-- ── V1 Contenu ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS news (
  id INTEGER PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  category VARCHAR(100) DEFAULT 'actualite',
  cover_image TEXT,
  cover_image_alt TEXT,
  published SMALLINT DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS studies (
  id INTEGER PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  summary TEXT,
  content TEXT NOT NULL,
  file_url TEXT,
  published SMALLINT DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS campaigns (
  id INTEGER PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT,
  image_url TEXT,
  petition_slug VARCHAR(255),
  active SMALLINT DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS partners (
  id INTEGER PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  logo_url TEXT,
  website TEXT,
  description TEXT,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS testimonials (
  id INTEGER PRIMARY KEY,
  author VARCHAR(255),
  role VARCHAR(255),
  content TEXT NOT NULL,
  photo TEXT,
  photo_alt TEXT,
  anonymous SMALLINT DEFAULT 0,
  published SMALLINT DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS actions (
  id INTEGER PRIMARY KEY,
  province VARCHAR(100) NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  date DATE,
  type VARCHAR(100) DEFAULT 'action',
  photo TEXT
);

CREATE TABLE IF NOT EXISTS press_releases (
  id INTEGER PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  file_url TEXT,
  published SMALLINT DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS site_settings (
  key VARCHAR(255) PRIMARY KEY,
  value TEXT NOT NULL
);

-- ── V1 Formulaires ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS memberships (
  id INTEGER PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS help_requests (
  id INTEGER PRIMARY KEY,
  status VARCHAR(50) DEFAULT 'new',
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS newsletter (
  id INTEGER PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id INTEGER PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

-- ── V2 Membres ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(50),
  province VARCHAR(100),
  role VARCHAR(50) DEFAULT 'member',
  membership_type VARCHAR(50) NOT NULL,
  military_link TEXT,
  parent_military_name VARCHAR(255),
  skills TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS family_links (
  id INTEGER PRIMARY KEY,
  parent_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  child_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  relationship VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending_child',
  initiated_by VARCHAR(20),
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS donations (
  id INTEGER PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  provider VARCHAR(50) NOT NULL,
  phone VARCHAR(50),
  transaction_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  donor_name VARCHAR(255),
  donor_email VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS petitions (
  id INTEGER PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  content TEXT,
  goal INTEGER DEFAULT 100,
  signatures_count INTEGER DEFAULT 0,
  active SMALLINT DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS petition_signatures (
  id INTEGER PRIMARY KEY,
  petition_id INTEGER REFERENCES petitions(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  signed_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS help_request_updates (
  id INTEGER PRIMARY KEY,
  help_request_id INTEGER REFERENCES help_requests(id) ON DELETE CASCADE,
  status VARCHAR(50),
  note TEXT,
  updated_by VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INTEGER PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(128) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used SMALLINT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL
);

-- ── V3 Live & Push ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS live_events (
  id INTEGER PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'scheduled',
  youtube_id VARCHAR(100),
  stream_url TEXT,
  replay_url TEXT,
  thumbnail TEXT,
  thumbnail_alt TEXT,
  chat_moderation SMALLINT DEFAULT 1,
  viewer_count INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL
);
-- Colonnes présentes dans le domaine (LiveEvent.thumbnail) mais absentes des
-- anciennes bases : sans elles, chaque cycle save/load perdait ces champs.
ALTER TABLE live_events ADD COLUMN IF NOT EXISTS thumbnail TEXT;
ALTER TABLE live_events ADD COLUMN IF NOT EXISTS thumbnail_alt TEXT;

CREATE TABLE IF NOT EXISTS live_chat_messages (
  id INTEGER PRIMARY KEY,
  live_event_id INTEGER REFERENCES live_events(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  author_name VARCHAR(100),
  content TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS live_polls (
  id INTEGER PRIMARY KEY,
  live_event_id INTEGER REFERENCES live_events(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  active SMALLINT DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS live_poll_votes (
  id INTEGER PRIMARY KEY,
  poll_id INTEGER REFERENCES live_polls(id) ON DELETE CASCADE,
  option_id VARCHAR(50) NOT NULL,
  voter_key VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  UNIQUE (poll_id, voter_key)
);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id INTEGER PRIMARY KEY,
  endpoint TEXT UNIQUE NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  topics TEXT[] DEFAULT '{lives}',
  created_at TIMESTAMPTZ NOT NULL
);

-- Snapshot JSON (fallback / compat dual-mode)
CREATE TABLE IF NOT EXISTS app_state (
  id INTEGER PRIMARY KEY DEFAULT 1,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id BIGSERIAL PRIMARY KEY,
  actor_type VARCHAR(50) NOT NULL,
  actor_identifier VARCHAR(255),
  endpoint VARCHAR(255) NOT NULL,
  action VARCHAR(255) NOT NULL,
  target VARCHAR(255),
  status VARCHAR(50) NOT NULL,
  ip VARCHAR(100),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Index & contraintes concurrence (R3.7) ────────────────────────────────

CREATE UNIQUE INDEX IF NOT EXISTS idx_news_slug ON news(slug);
CREATE UNIQUE INDEX IF NOT EXISTS idx_studies_slug ON studies(slug);
CREATE UNIQUE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter(lower(email));
CREATE UNIQUE INDEX IF NOT EXISTS idx_petition_sig_unique ON petition_signatures(petition_id, lower(email));
CREATE INDEX IF NOT EXISTS idx_users_email ON users(lower(email));
CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(status);
CREATE INDEX IF NOT EXISTS idx_petitions_slug ON petitions(slug);
CREATE INDEX IF NOT EXISTS idx_live_events_slug ON live_events(slug);
CREATE INDEX IF NOT EXISTS idx_help_requests_status ON help_requests(status);
CREATE INDEX IF NOT EXISTS idx_admin_audit_created_at ON admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_chat_event_created ON live_chat_messages(live_event_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Portail membre (Phase 3) -------------------------------------------------
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  province VARCHAR(120),
  "date" TEXT,
  "time" TEXT,
  type VARCHAR(50),
  location TEXT,
  capacity INTEGER,
  rsvp_user_ids JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS member_messages (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  direction VARCHAR(10) NOT NULL,
  author_name VARCHAR(200),
  subject TEXT,
  body TEXT NOT NULL,
  "read" SMALLINT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS member_resources (
  id INTEGER PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  category VARCHAR(120),
  description TEXT,
  file_url TEXT,
  external_url TEXT,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_date ON events("date");
CREATE INDEX IF NOT EXISTS idx_member_messages_user ON member_messages(user_id);

-- ── Index de performance (audit trafic massif) ─────────────────────────────
-- PostgreSQL n'indexe PAS automatiquement les clés étrangères : sans ces
-- index, chaque lecture par parent était un scan séquentiel de la table.

-- Clés étrangères lues à chaque affichage (portail, dons, famille, live).
CREATE INDEX IF NOT EXISTS idx_donations_user ON donations(user_id);
CREATE INDEX IF NOT EXISTS idx_family_links_parent ON family_links(parent_user_id);
CREATE INDEX IF NOT EXISTS idx_family_links_child ON family_links(child_user_id);
CREATE INDEX IF NOT EXISTS idx_live_polls_event ON live_polls(live_event_id);
CREATE INDEX IF NOT EXISTS idx_help_request_updates_request
  ON help_request_updates(help_request_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_user ON password_reset_tokens(user_id);

-- Listes publiques : filtre `published/active` + tri `created_at DESC`.
-- Index composites : le tri est servi par l'index, plus de tri en mémoire.
CREATE INDEX IF NOT EXISTS idx_news_published_created
  ON news(published, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_studies_published_created
  ON studies(published, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaigns_active_created
  ON campaigns(active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_testimonials_published_created
  ON testimonials(published, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_press_releases_published_created
  ON press_releases(published, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_actions_date ON actions("date" DESC);

-- Chat live : le filtre porte sur (event, status) — l'index existant
-- (live_event_id, created_at) obligeait à relire toutes les lignes de
-- l'événement pour écarter les messages non approuvés.
CREATE INDEX IF NOT EXISTS idx_live_chat_event_status_created
  ON live_chat_messages(live_event_id, status, created_at DESC);

-- Divers chemins chauds.
CREATE INDEX IF NOT EXISTS idx_petition_sig_signed_at
  ON petition_signatures(signed_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_membership_province
  ON users(membership_type, province);
CREATE INDEX IF NOT EXISTS idx_events_province ON events(province);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_topics
  ON push_subscriptions USING GIN(topics);

-- ── Séquences d'ID par table (refactor persistance P1) ─────────────────────
-- Remplace le compteur global en mémoire (nextId) : élimine les collisions
-- multi-instances. Séquences volontairement NON-OWNED pendant la transition
-- (immunisées contre TRUNCATE ... RESTART IDENTITY si l'ancien code tourne
-- encore, ex. rollback) ; OWNED BY posé au teardown final.
-- Bloc idempotent et monotone : rejouable à chaque démarrage de process.
DO $$
DECLARE
  t TEXT;
  seq TEXT;
  target BIGINT;
  cur BIGINT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'news','studies','campaigns','partners','testimonials','actions',
    'press_releases','memberships','help_requests','newsletter',
    'contact_messages','users','family_links','donations','petitions',
    'petition_signatures','help_request_updates','password_reset_tokens',
    'live_events','live_chat_messages','live_polls','live_poll_votes',
    'push_subscriptions','events','member_messages','member_resources'])
  LOOP
    seq := t || '_id_seq';
    IF NOT EXISTS (SELECT FROM pg_class WHERE relkind = 'S' AND relname = seq) THEN
      EXECUTE format('CREATE SEQUENCE %I', seq);
    END IF;
    -- Seuil : max(id) de la table ET compteur global historique (les ids
    -- existants proviennent d'un compteur unique inter-tables).
    EXECUTE format(
      'SELECT GREATEST(COALESCE((SELECT MAX(id)::bigint FROM %I), 0),
                       COALESCE((SELECT (counters->>''global'')::bigint FROM store_meta WHERE id = 1), 0),
                       100)', t) INTO target;
    EXECUTE format('SELECT last_value FROM %I', seq) INTO cur;
    IF target > cur THEN
      PERFORM setval(seq, target);
    END IF;
    EXECUTE format('ALTER TABLE %I ALTER COLUMN id SET DEFAULT nextval(%L)', t, seq);
    -- Teardown P1 (C13) : plus aucun TRUNCATE ... RESTART IDENTITY dans le
    -- code — les séquences peuvent être rattachées à leur colonne (ménage
    -- DROP TABLE, comportement standard).
    EXECUTE format('ALTER SEQUENCE %I OWNED BY %I.id', seq, t);
  END LOOP;
END $$;
