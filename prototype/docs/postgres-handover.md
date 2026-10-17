# Moving from Supabase to the company PostgreSQL

The prototype talks to its backend through four small files. Everything else in the app (screens, tools, tests) is unaware of Supabase.

| File | What it does today with Supabase | What the company backend must provide |
|---|---|---|
| `src/utils/store.js` (`connectCloud`, `flush`, `disconnectCloud`) | Loads all rows of table `kv` at sign-in, keeps them in memory (reads stay synchronous), saves changed keys in batches, follows other users' changes live | Read all allowed keys; save a batch of keys; push changes made by others |
| `src/utils/supabase.js` | Email and password sign-in, session restore, sign-out; the account's `app_metadata.portal` decides the portal | Sign-in returning the user's portal (`client`, `team`, `manager`, `fo`, `management`), title and `client_slug` |
| `src/utils/files.js` | Uploads to a private bucket `documents`, opens a file through a five-minute link | Upload, and a short-lived download link |
| `api/*.js` (Vercel functions) | AI steps and e-mail | Same endpoints in the company API; the AI helper is `api/_ai.js` |

## Data model (plain PostgreSQL)

```sql
create table app_user (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  portal text not null check (portal in ('client','team','manager','fo','management')),
  title text not null default '',            -- Audit Lead / Associate for the team portal
  client_slug text                           -- clients only: the one client file they belong to
);
create table kv (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references app_user(id)
);
create table document (                      -- the file itself goes to disk or object storage
  id uuid primary key default gen_random_uuid(),
  path text unique not null,                 -- <client_slug>/<requirement ref>/<time>-<safe name>
  original_name text not null, size bigint, content_type text,
  uploaded_by uuid references app_user(id), uploaded_at timestamptz not null default now()
);
create function notify_kv() returns trigger language plpgsql as $$
begin perform pg_notify('kv_changed', json_build_object('key', coalesce(new.key, old.key), 'by', new.updated_by)::text); return null; end $$;
create trigger kv_notify after insert or update or delete on kv for each row execute function notify_kv();
```

## Who may touch which keys (enforce this on the server, from the signed-in user's portal)

| Key group | Keys | client | team | manager, management | fo |
|---|---|---|---|---|---|
| shared | `requirements:issued`, `requirements:tb`, `queries`, `client-activity`, `audit360_direct_messages`, `demo:loaded`, `audit360_raised_escalations`, `workingtb:*` | read, write | read, write | read, write | read, write |
| staff | `client-profiles`, `audit-log`, `el-requests`, `el-coordinators` | none | read, write | read, write | read, write |
| front office | `fo-*`, `audit360_generated_proposals` | none | read | read, write | read, write |
| internal | every other key | none | read, write | read, write | none |
| personal | `u:<user id>:*` (the app stores `audit360-*` and `audixa-*` preferences this way) | own only | own only | own only | own only |

Documents: team, manager and management read and write all; a client only paths whose first segment equals its `client_slug`; front office none.
The same rules exist as SQL in the Supabase project (functions `kv_portal`, `kv_group`, `kv_ok`, `documents_ok`); the Python or TypeScript version must behave the same. The test that proves it is: for each portal and each key group, one allowed and one refused read and write.

## Server endpoints the front end will call (suggested)

- `POST /auth/login` (email, password) returns a session token and `{ portal, title, client_slug }`; `POST /auth/logout`.
- `GET /kv` returns every key the user may read as `[{ key, value }]`.
- `PUT /kv` takes `[{ key, value }]` and answers per key. A refused key must come back as refused (the app then drops the change and reloads the saved value; `store.js` already handles this).
- `GET /kv/events` (server-sent events or a WebSocket fed by `LISTEN kv_changed`) pushes `{ eventType, key, value }` to the other signed-in users.
- `POST /files` (multipart: client_slug, ref, file) stores the file and returns its path; `GET /files/link?path=...` returns a short-lived URL. Check `documents_ok` on both.

## What to change in the front end

1. `supabase.js`: replace the client with calls to the endpoints above; keep the exported names (`cloudOn`, `signIn`, `restoreSession`, `signOut`) so nothing else changes.
2. `store.js`: `connectCloud(client)` and `flush()` take a Supabase-shaped client. Either give them a small adapter object with `from('kv').select()/upsert()`, `channel()`, `removeChannel()` and `auth.getSession()`, or rewrite those two functions against the endpoints. The tests in `scripts/cloudstore.test.mjs` show the exact behaviour expected.
3. `files.js`: replace the two storage calls (`upload`, `createSignedUrl`).
4. Environment: the front end needs only the API base URL; keep every secret on the server.

## Known gaps to close in the company build

- Shared keys hold all clients' data in one block each. Before a second client is added, split them per client (for example `c:<client>:requirements:issued`) and require the client slug in the rule.
- Each key is saved as a whole (last write wins). Row-level tables per record (requirements, queries, adjustments) are the proper long-term shape.
- Files are not scanned and stay when an item is withdrawn.
- Reading the content of uploaded documents and bank statements is not built.
