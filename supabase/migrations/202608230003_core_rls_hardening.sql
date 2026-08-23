begin;

-- Remove development/broad policies that expose private operational data.
drop policy if exists "view can read projects" on public.projects;
drop policy if exists "projects write" on public.projects;
drop policy if exists "client can update own project invoice_id" on public.projects;
drop policy if exists "projects_update_safe" on public.projects;
drop policy if exists "update_publishing_owner_or_publisher" on public.projects;
drop policy if exists "dev_invoices_read_all" on public.invoices;
drop policy if exists "dev_items_read_all" on public.invoice_items;
drop policy if exists "insert own invoices" on public.invoices;
drop policy if exists "insert items via own invoice" on public.invoice_items;
drop policy if exists "assignments select (authed)" on public.assignments;
drop policy if exists "read meetings" on public.meetings;
drop policy if exists "insert meetings" on public.meetings;

create or replace function public.set_meeting_created_by()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.created_by is null then new.created_by := auth.uid(); end if;
  return new;
end;
$$;
drop trigger if exists set_meeting_created_by_trigger on public.meetings;
create trigger set_meeting_created_by_trigger before insert on public.meetings
  for each row execute function public.set_meeting_created_by();

drop policy if exists projects_admin_update on public.projects;
create policy projects_admin_update on public.projects
  for update to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.main_role in ('admin','owner')))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.main_role in ('admin','owner')));

drop policy if exists meetings_participant_select on public.meetings;
create policy meetings_participant_select on public.meetings
  for select to authenticated using (
    client_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.main_role in ('admin','owner'))
    or exists (select 1 from public.assignments a where a.project_id = meetings.project_id and a.user_id = auth.uid() and a.active)
  );
drop policy if exists meetings_participant_insert on public.meetings;
create policy meetings_participant_insert on public.meetings
  for insert to authenticated with check (
    created_by = auth.uid()
    and (
      client_id = auth.uid()
      or exists (select 1 from public.profiles p where p.id = auth.uid() and p.main_role in ('admin','owner'))
      or exists (select 1 from public.assignments a where a.project_id = meetings.project_id and a.user_id = auth.uid() and a.active)
    )
  );
drop policy if exists meetings_participant_update on public.meetings;
create policy meetings_participant_update on public.meetings
  for update to authenticated
  using (created_by = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.main_role in ('admin','owner')))
  with check (created_by = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.main_role in ('admin','owner')));
drop policy if exists meetings_participant_delete on public.meetings;
create policy meetings_participant_delete on public.meetings
  for delete to authenticated
  using (created_by = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.main_role in ('admin','owner')));

-- A user may edit public profile fields, but never roles, consent evidence, email,
-- user id, or timestamps. Admin APIs use service_role and are unaffected.
revoke insert on public.profiles from authenticated;
revoke update on public.profiles from authenticated;
grant update (artist_name, avatar_path, avatar_url, first_name, last_name, location, name, phone_number, username)
  on public.profiles to authenticated;

-- SECURITY DEFINER invoice mutation helpers must not be callable from browsers.
revoke all on function public.invoice_add_custom_item(uuid, text, numeric, numeric, integer) from public, anon, authenticated;
revoke all on function public.invoice_add_item_from_service(uuid, uuid, numeric, numeric, text, integer) from public, anon, authenticated;
grant execute on function public.invoice_add_custom_item(uuid, text, numeric, numeric, integer) to service_role;
grant execute on function public.invoice_add_item_from_service(uuid, uuid, numeric, numeric, text, integer) to service_role;
revoke all on function public.invoices_next_no() from public, anon;
revoke all on function public.next_invoice_no() from public, anon;

-- Lifecycle RPCs previously updated any project without checking the caller.
create or replace function public.can_manage_project(p_project_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and exists (
    select 1 from public.projects p
    where p.project_id = p_project_id
      and (
        p.client_id = auth.uid()
        or exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.main_role in ('admin','owner'))
      )
  );
$$;
revoke all on function public.can_manage_project(uuid) from public, anon;
grant execute on function public.can_manage_project(uuid) to authenticated, service_role;

create or replace function public.accept_project(p_project_id uuid)
returns integer language plpgsql security definer set search_path = public as $$
declare v_count integer := 0;
begin
  if not public.can_manage_project(p_project_id) then raise exception 'Project access denied' using errcode = '42501'; end if;
  update public.projects set status = 'in_progress', stage = 'awaiting_payment', updated_at = now() where project_id = p_project_id;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create or replace function public.put_project_on_hold(p_project_id uuid)
returns integer language plpgsql security definer set search_path = public as $$
declare v_count integer := 0;
begin
  if not public.can_manage_project(p_project_id) then raise exception 'Project access denied' using errcode = '42501'; end if;
  update public.projects set status = 'on_hold', updated_at = now() where project_id = p_project_id;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create or replace function public.resume_project(p_project_id uuid)
returns integer language plpgsql security definer set search_path = public as $$
declare v_count integer := 0;
begin
  if not public.can_manage_project(p_project_id) then raise exception 'Project access denied' using errcode = '42501'; end if;
  update public.projects set status = 'in_progress', updated_at = now() where project_id = p_project_id;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.accept_project(uuid) from public, anon;
revoke all on function public.put_project_on_hold(uuid) from public, anon;
revoke all on function public.resume_project(uuid) from public, anon;
revoke all on function public.continue_project(uuid) from public, anon;
grant execute on function public.accept_project(uuid) to authenticated, service_role;
grant execute on function public.put_project_on_hold(uuid) to authenticated, service_role;
grant execute on function public.resume_project(uuid) to authenticated, service_role;
grant execute on function public.continue_project(uuid) to authenticated, service_role;

commit;
