-- Closet Labs initial schema. Multi-user from day 1 (user_id everywhere);
-- RLS policies land in the auth phase. Apply with: supabase db push
create extension if not exists vector;

create table palettes (
  id text primary key,
  name text not null,
  kind text not null check (kind in ('harmony', 'seasonal', 'editorial', 'custom')),
  harmony text,
  season text,
  colors jsonb not null, -- PaletteColor[]
  user_id uuid, -- null = curated seed row
  created_at timestamptz not null default now()
);

create table retailers (
  id text primary key,
  source text not null,
  name text not null,
  domain text not null,
  tier text not null check (tier in ('fast-fashion', 'mid', 'luxury', 'marketplace', 'custom')),
  logo_url text,
  updated_at timestamptz not null default now()
);

create table user_prefs (
  user_id uuid primary key,
  selected_retailer_ids text[] not null default '{}',
  custom_stores jsonb not null default '[]', -- CustomStore[]
  price_min numeric not null default 0,
  price_max numeric not null default 500,
  gender text not null default 'all' check (gender in ('all', 'women', 'men')),
  skin_tone_id text not null default 'tone-3',
  updated_at timestamptz not null default now()
);

-- search cache; embedding computed lazily for inspo re-ranking
create table products (
  id text primary key,
  source text not null,
  source_product_id text not null,
  title text not null,
  brand text,
  image_url text not null,
  price_amount numeric not null,
  price_currency text not null default 'USD',
  sale_price numeric,
  product_url text not null,
  retailer jsonb not null, -- { id, name, domain }
  colors text[] not null default '{}',
  category text,
  embedding vector(512),
  fetched_at timestamptz not null default now()
);
create index products_embedding_idx on products
  using hnsw (embedding vector_cosine_ops);

create table inspo_images (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  source_type text not null check (source_type in ('upload', 'pinterest-pin')),
  source_url text,
  storage_path text not null,
  dominant_colors text[] not null default '{}',
  garment_labels text[] not null default '{}',
  embedding vector(512),
  created_at timestamptz not null default now()
);

create table outfits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  name text not null,
  skin_tone_id text not null,
  items jsonb not null default '[]', -- OutfitItem[]
  updated_at timestamptz not null default now()
);

create table trend_entries (
  id text primary key,
  title text not null,
  blurb text not null,
  season text not null,
  year int not null,
  image_url text,
  source_url text,
  palette_id text references palettes (id),
  search_terms text[] not null default '{}'
);

create table saved_items (
  user_id uuid,
  kind text not null check (kind in ('product', 'palette', 'outfit', 'inspo')),
  ref_id text not null,
  snapshot jsonb, -- denormalized copy so saves survive cache eviction
  created_at timestamptz not null default now(),
  primary key (user_id, kind, ref_id)
);

-- top-K similar cached products for inspo matching
create function match_products(
  query_embedding vector(512),
  match_count int default 24,
  filter_retailers text[] default null
) returns setof products
language sql stable as $$
  select p.* from products p
  where p.embedding is not null
    and (filter_retailers is null or p.retailer->>'id' = any (filter_retailers))
  order by p.embedding <=> query_embedding
  limit match_count;
$$;
