begin;

create table if not exists public.seo_pages (
  path text primary key,
  locale text check (locale is null or locale in ('en-US', 'id-ID')),
  alternate_path text,
  change_frequency text not null default 'weekly'
    check (change_frequency in ('always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never')),
  priority numeric(3, 2) not null default 0.70
    check (priority >= 0 and priority <= 1),
  is_published boolean not null default false,
  published_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint seo_pages_path_format check (path ~ '^/[a-z0-9][a-z0-9/-]*$'),
  constraint seo_pages_alternate_path_format check (
    alternate_path is null or alternate_path ~ '^/[a-z0-9][a-z0-9/-]*$'
  ),
  constraint seo_pages_published_at_required check (
    not is_published or published_at is not null
  )
);

alter table public.seo_pages enable row level security;

drop policy if exists "Published SEO pages are publicly readable" on public.seo_pages;
create policy "Published SEO pages are publicly readable"
  on public.seo_pages
  for select
  to anon, authenticated
  using (is_published = true);

drop policy if exists "Admins manage SEO pages" on public.seo_pages;
create policy "Admins manage SEO pages"
  on public.seo_pages
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.main_role in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.main_role in ('owner', 'admin')
    )
  );

create index if not exists seo_pages_published_idx
  on public.seo_pages (updated_at desc)
  where is_published = true;

create or replace function public.set_seo_pages_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_seo_pages_updated_at on public.seo_pages;
create trigger set_seo_pages_updated_at
  before update on public.seo_pages
  for each row
  execute function public.set_seo_pages_updated_at();

insert into public.seo_pages (
  path,
  locale,
  alternate_path,
  change_frequency,
  priority,
  is_published,
  published_at
)
values
  (
    '/learn/how-to-make-a-song',
    'en-US',
    '/id/cara-bikin-lagu',
    'weekly',
    0.80,
    true,
    '2026-08-30T00:00:00+07:00'
  ),
  (
    '/id/cara-bikin-lagu',
    'id-ID',
    '/learn/how-to-make-a-song',
    'weekly',
    0.80,
    true,
    '2026-08-30T00:00:00+07:00'
  )
on conflict (path) do nothing;

comment on table public.seo_pages is
  'Published SEO routes included automatically in the native Next.js sitemap.';

commit;
