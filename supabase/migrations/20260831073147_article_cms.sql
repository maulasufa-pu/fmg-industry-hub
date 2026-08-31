begin;

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  locale text not null default 'id-ID'
    check (locale in ('id-ID', 'en-US')),
  path text generated always as (
    case
      when locale = 'id-ID' then '/id/artikel/' || slug
      else '/articles/' || slug
    end
  ) stored,
  title text not null default 'Untitled article'
    check (char_length(title) between 1 and 180),
  excerpt text not null default ''
    check (char_length(excerpt) <= 500),
  seo_title text not null default ''
    check (char_length(seo_title) <= 180),
  seo_description text not null default ''
    check (char_length(seo_description) <= 500),
  keywords text[] not null default '{}',
  cover_image_url text,
  cover_image_alt text,
  content jsonb not null default '[]'::jsonb
    check (jsonb_typeof(content) = 'array'),
  design jsonb not null default '{"theme":"editorial","accent":"violet","heroStyle":"gradient","bodyWidth":"comfortable","showToc":true}'::jsonb
    check (jsonb_typeof(design) = 'object'),
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  author_name text not null default 'FMG Universe Editorial'
    check (char_length(author_name) between 1 and 120),
  reading_minutes smallint not null default 1
    check (reading_minutes between 1 and 120),
  is_featured boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint articles_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint articles_path_unique unique (path),
  constraint articles_publish_date check (status <> 'published' or published_at is not null)
);

comment on table public.articles is
  'Block-based bilingual article CMS. Public users can only read published rows.';

alter table public.articles enable row level security;

grant select on public.articles to anon;
grant select, insert, update, delete on public.articles to authenticated;
grant all on public.articles to service_role;

create index if not exists articles_published_path_idx
  on public.articles (path, updated_at desc)
  where status = 'published';

create index if not exists articles_admin_status_updated_idx
  on public.articles (status, updated_at desc);

create index if not exists articles_created_by_idx
  on public.articles (created_by)
  where created_by is not null;

create index if not exists articles_updated_by_idx
  on public.articles (updated_by)
  where updated_by is not null;

drop policy if exists "Published articles are publicly readable" on public.articles;
create policy "Published articles are publicly readable"
  on public.articles
  for select
  to anon, authenticated
  using (
    status = 'published'
    or exists (
      select 1
      from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.main_role in ('owner', 'admin')
    )
  );

drop policy if exists "Admins create articles" on public.articles;
create policy "Admins create articles"
  on public.articles
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.main_role in ('owner', 'admin')
    )
  );

drop policy if exists "Admins update articles" on public.articles;
create policy "Admins update articles"
  on public.articles
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.main_role in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.main_role in ('owner', 'admin')
    )
  );

drop policy if exists "Admins delete articles" on public.articles;
create policy "Admins delete articles"
  on public.articles
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.main_role in ('owner', 'admin')
    )
  );

create or replace function public.set_articles_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_articles_updated_at on public.articles;
create trigger set_articles_updated_at
  before update on public.articles
  for each row
  execute function public.set_articles_updated_at();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'article-media',
  'article-media',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

commit;
