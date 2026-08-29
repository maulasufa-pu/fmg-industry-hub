begin;

drop policy if exists "Published SEO pages are publicly readable" on public.seo_pages;
drop policy if exists "Admins manage SEO pages" on public.seo_pages;

create policy "Published pages and admin drafts are readable"
  on public.seo_pages
  for select
  to anon, authenticated
  using (
    is_published = true
    or exists (
      select 1
      from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.main_role in ('owner', 'admin')
    )
  );

create policy "Admins insert SEO pages"
  on public.seo_pages
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

create policy "Admins update SEO pages"
  on public.seo_pages
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

create policy "Admins delete SEO pages"
  on public.seo_pages
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

commit;
