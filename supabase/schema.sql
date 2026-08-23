--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pg_net; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";


--
-- Name: EXTENSION "pg_net"; Type: COMMENT; Schema: -; Owner:
--

COMMENT ON EXTENSION "pg_net" IS 'Async HTTP';


--
-- Name: SCHEMA "public"; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA "public" IS 'standard public schema';


--
-- Name: citext; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "citext" WITH SCHEMA "public";


--
-- Name: EXTENSION "citext"; Type: COMMENT; Schema: -; Owner:
--

COMMENT ON EXTENSION "citext" IS 'data type for case-insensitive character strings';


--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";


--
-- Name: EXTENSION "pg_stat_statements"; Type: COMMENT; Schema: -; Owner:
--

COMMENT ON EXTENSION "pg_stat_statements" IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";


--
-- Name: EXTENSION "pgcrypto"; Type: COMMENT; Schema: -; Owner:
--

COMMENT ON EXTENSION "pgcrypto" IS 'cryptographic functions';


--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";


--
-- Name: EXTENSION "supabase_vault"; Type: COMMENT; Schema: -; Owner:
--

COMMENT ON EXTENSION "supabase_vault" IS 'Supabase Vault Extension';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner:
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: draft_category; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."draft_category" AS ENUM (
    'mixing',
    'mastering',
    'composition',
    'arrangement',
    'production'
);


ALTER TYPE "public"."draft_category" OWNER TO "postgres";

--
-- Name: global_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."global_role" AS ENUM (
    'owner',
    'admin',
    'client',
    'guest'
);


ALTER TYPE "public"."global_role" OWNER TO "postgres";

--
-- Name: invoice_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."invoice_status" AS ENUM (
    'draft',
    'unpaid',
    'paid',
    'cancelled'
);


ALTER TYPE "public"."invoice_status" OWNER TO "postgres";

--
-- Name: payment_plan_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."payment_plan_type" AS ENUM (
    'upfront',
    'half',
    'milestone'
);


ALTER TYPE "public"."payment_plan_type" OWNER TO "postgres";

--
-- Name: project_stage; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."project_stage" AS ENUM (
    'drafting',
    'production',
    'revision',
    'mixing',
    'mastering',
    'distribution',
    'recording',
    'editing',
    'completed',
    'request_payment',
    'awaiting_payment',
    'assign_team',
    'draft1_work',
    'draft1_review',
    'finalization',
    'metadata',
    'agreement',
    'releasing'
);


ALTER TYPE "public"."project_stage" OWNER TO "postgres";

--
-- Name: project_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."project_status" AS ENUM (
    'pending',
    'in_progress',
    'unpaid',
    'approved',
    'published',
    'archived',
    'cancelled',
    'requested',
    'finished',
    'on_hold',
    'hold'
);


ALTER TYPE "public"."project_status" OWNER TO "postgres";

--
-- Name: staff_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."staff_role" AS ENUM (
    'anr',
    'engineer',
    'producer',
    'composer',
    'publisher',
    'admin'
);


ALTER TYPE "public"."staff_role" OWNER TO "postgres";

--
-- Name: _can_continue_project("uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."_can_continue_project"("p_project_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  select exists (
    select 1
    from profiles pr
    where pr.id = auth.uid()
      and (
        pr.main_role in ('owner','admin')
        or exists (
          select 1
          from assignments a
          where a.project_id = p_project_id
            and a.user_id = pr.id
            and a.active = true
        )
      )
  );
$$;


ALTER FUNCTION "public"."_can_continue_project"("p_project_id" "uuid") OWNER TO "postgres";

--
-- Name: _is_admin_or_owner("uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."_is_admin_or_owner"("uid" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = uid
      -- main_role sudah enum public.global_role (bukan array), jadi pakai IN + cast enum
      AND p.main_role IN ('owner'::public.global_role, 'admin'::public.global_role)
  );
$$;


ALTER FUNCTION "public"."_is_admin_or_owner"("uid" "uuid") OWNER TO "postgres";

--
-- Name: accept_project("uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."accept_project"("p_project_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare v_count integer := 0;
begin
  if not public.can_manage_project(p_project_id) then raise exception 'Project access denied' using errcode = '42501'; end if;
  update public.projects set status = 'in_progress', stage = 'awaiting_payment', updated_at = now() where project_id = p_project_id;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;


ALTER FUNCTION "public"."accept_project"("p_project_id" "uuid") OWNER TO "postgres";

--
-- Name: apply_terms_consent_to_profile(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."apply_terms_consent_to_profile"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
declare metadata jsonb;
begin
  select raw_user_meta_data into metadata from auth.users where id = new.id;
  new.terms_version := coalesce(new.terms_version, nullif(metadata ->> 'terms_version', ''));
  if new.terms_accepted_at is null and coalesce(metadata ->> 'terms_accepted_at', '') ~ '^\d{4}-\d{2}-\d{2}T' then
    new.terms_accepted_at := (metadata ->> 'terms_accepted_at')::timestamptz;
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."apply_terms_consent_to_profile"() OWNER TO "postgres";

--
-- Name: can_manage_project("uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."can_manage_project"("p_project_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select auth.uid() is not null and exists (
    select 1 from public.projects p
    where p.project_id = p_project_id
      and (
        p.client_id = auth.uid()
        or exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.main_role in ('admin','owner'))
      )
  );
$$;


ALTER FUNCTION "public"."can_manage_project"("p_project_id" "uuid") OWNER TO "postgres";

--
-- Name: continue_project("uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."continue_project"("p_project_id" "uuid") RETURNS "void"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
  select public.resume_project(p_project_id);
$$;


ALTER FUNCTION "public"."continue_project"("p_project_id" "uuid") OWNER TO "postgres";

--
-- Name: drafts_set_version(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."drafts_set_version"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if new.version is null then
    select coalesce(max(version),0)+1
      into new.version
    from drafts
    where project_id = new.project_id;
  end if;
  return new;
end $$;


ALTER FUNCTION "public"."drafts_set_version"() OWNER TO "postgres";

--
-- Name: drafts_touch_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."drafts_touch_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at := now();
  return new;
end $$;


ALTER FUNCTION "public"."drafts_touch_updated_at"() OWNER TO "postgres";

--
-- Name: gen_unique_username("text", "uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."gen_unique_username"("base_in" "text", "id_in" "uuid") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  base text := lower(regexp_replace(coalesce(base_in, ''), '[^a-z0-9._-]+', '', 'g'));
  try  text;
  n    integer := 0;
begin
  if base = '' then
    -- fallback: dari id/email local-part akan di-handle pemanggil
    base := '';
  end if;

  loop
    try := case when n = 0 then base else base || n::text end;
    exit when try <> '' and not exists (
      select 1 from public.profiles p where lower(p.username) = lower(try) and p.id <> id_in
    );
    n := n + 1;
    if n > 1000 then
      -- extremely unlikely
      try := base || '_' || substr(replace(id_in::text,'-',''), 1, 6);
      exit;
    end if;
  end loop;

  return try;
end
$$;


ALTER FUNCTION "public"."gen_unique_username"("base_in" "text", "id_in" "uuid") OWNER TO "postgres";

--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  md           jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  given        text := coalesce(md->>'given_name', md->>'first_name', '');
  family       text := coalesce(md->>'family_name', md->>'last_name',  '');
  display_name text := nullif(coalesce(md->>'name', concat_ws(' ', given, family)), '');
  artist       text := nullif(md->>'artist_name', '');
  loc          text := nullif(md->>'location', '');
  phone        text := nullif(coalesce(md->>'phone_number', md->>'phone'), '');
  av_url       text := nullif(coalesce(md->>'avatar_url', md->>'picture'), '');
  av_path_raw  text := nullif(md->>'avatar_path', '');
  av_path      text := case
                         when av_path_raw ~* '^https?://' then null
                         else av_path_raw
                       end;
  uname_base   text := nullif(coalesce(
                       md->>'preferred_username',
                       md->>'user_name',
                       md->>'nickname',
                       split_part(new.email, '@', 1)
                     ), '');
  uname_final  text;
begin
  -- Normalisasi base username (bisa kosong → nanti fallback)
  uname_base := lower(regexp_replace(uname_base, '[^a-z0-9._-]+', '', 'g'));
  if uname_base = '' then
    uname_base := lower(regexp_replace(split_part(coalesce(new.email,''), '@', 1), '[^a-z0-9._-]+', '', 'g'));
    if uname_base = '' then
      uname_base := 'user';
    end if;
  end if;

  uname_final := public.gen_unique_username(uname_base, new.id);

  insert into public.profiles (
    id, email, first_name, last_name, name,
    artist_name, location, phone_number,
    avatar_url, avatar_path, username,
    main_role, staff_role
  )
  values (
    new.id,
    new.email,
    given,
    family,
    display_name,
    artist,
    loc,
    phone,
    av_url,
    av_path,
    uname_final,
    'client'::public.global_role,
    '{}'::public.staff_role[]
  )
  on conflict (id) do nothing;

  return new;
end
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";

--
-- Name: handle_user_updated(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."handle_user_updated"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  md           jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  given        text := coalesce(md->>'given_name', md->>'first_name', '');
  family       text := coalesce(md->>'family_name', md->>'last_name',  '');
  display_name text := nullif(coalesce(md->>'name', concat_ws(' ', given, family)), '');
  artist       text := nullif(md->>'artist_name', '');
  loc          text := nullif(md->>'location', '');
  phone        text := nullif(coalesce(md->>'phone_number', md->>'phone'), '');
  av_url       text := nullif(coalesce(md->>'avatar_url', md->>'picture'), '');
  av_path_raw  text := nullif(md->>'avatar_path', '');
  av_path      text := case
                         when av_path_raw ~* '^https?://' then null
                         else av_path_raw
                       end;
  uname_meta   text := nullif(coalesce(
                       md->>'preferred_username',
                       md->>'user_name',
                       md->>'nickname',
                       split_part(new.email, '@', 1)
                     ), '');
  uname_norm   text;
  want_username text := null;
begin
  -- Normalisasi kandidat username
  if uname_meta is not null then
    uname_norm := lower(regexp_replace(uname_meta, '[^a-z0-9._-]+', '', 'g'));
    if uname_norm <> '' then
      want_username := public.gen_unique_username(uname_norm, new.id);
    end if;
  end if;

  update public.profiles p
  set
    email       = new.email,
    -- Hanya isi kalau kosong / null (tidak menimpa edit manual user)
    first_name  = case when coalesce(p.first_name, '') = '' and given <> '' then given else p.first_name end,
    last_name   = case when coalesce(p.last_name,  '') = '' and family <> '' then family else p.last_name end,
    name        = case when p.name is null and display_name is not null then display_name else p.name end,
    artist_name = case when p.artist_name is null and artist is not null then artist else p.artist_name end,
    location    = case when p.location is null and loc is not null then loc else p.location end,
    phone_number= case when p.phone_number is null and phone is not null then phone else p.phone_number end,
    avatar_url  = coalesce(p.avatar_url, av_url),
    avatar_path = coalesce(p.avatar_path, av_path),
    username    = case
                    when coalesce(p.username,'') = '' and want_username is not null then want_username
                    else p.username
                  end
  where p.id = new.id;

  return new;
end
$$;


ALTER FUNCTION "public"."handle_user_updated"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";

--
-- Name: invoice_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."invoice_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invoice_id" "uuid" NOT NULL,
    "description" "text" NOT NULL,
    "qty" integer DEFAULT 1 NOT NULL,
    "unit_price" bigint DEFAULT 0 NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    "service_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "invoice_items_qty_check" CHECK (("qty" >= 1)),
    CONSTRAINT "invoice_items_unit_price_check" CHECK (("unit_price" >= 0))
);


ALTER TABLE "public"."invoice_items" OWNER TO "postgres";

--
-- Name: invoice_add_custom_item("uuid", "text", numeric, numeric, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."invoice_add_custom_item"("p_invoice_id" "uuid", "p_description" "text", "p_qty" numeric, "p_unit_price" numeric, "p_position" integer DEFAULT NULL::integer) RETURNS "public"."invoice_items"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  next_pos int;
  r public.invoice_items;
begin
  if p_position is null then
    select coalesce(max(position), 0) + 10
      into next_pos
    from public.invoice_items
    where invoice_id = p_invoice_id;
  else
    next_pos := p_position;
  end if;

  insert into public.invoice_items(invoice_id, description, qty, unit_price, position)
  values (p_invoice_id, p_description, p_qty, p_unit_price, next_pos)
  returning * into r;

  return r;
end;
$$;


ALTER FUNCTION "public"."invoice_add_custom_item"("p_invoice_id" "uuid", "p_description" "text", "p_qty" numeric, "p_unit_price" numeric, "p_position" integer) OWNER TO "postgres";

--
-- Name: invoice_add_item_from_service("uuid", "uuid", numeric, numeric, "text", integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."invoice_add_item_from_service"("p_invoice_id" "uuid", "p_service_id" "uuid", "p_qty" numeric DEFAULT 1, "p_unit_price" numeric DEFAULT NULL::numeric, "p_description" "text" DEFAULT NULL::"text", "p_position" integer DEFAULT NULL::integer) RETURNS "public"."invoice_items"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  s record;
  next_pos int;
  r public.invoice_items;
begin
  select id, label, price into s
  from public.services
  where id = p_service_id and is_active = true;

  if not found then
    raise exception 'Service not found or inactive';
  end if;

  if p_position is null then
    select coalesce(max(position), 0) + 10
      into next_pos
    from public.invoice_items
    where invoice_id = p_invoice_id;
  else
    next_pos := p_position;
  end if;

  insert into public.invoice_items(invoice_id, service_id, description, qty, unit_price, position)
  values (
    p_invoice_id,
    s.id,
    coalesce(p_description, s.label),
    coalesce(p_qty, 1),
    coalesce(p_unit_price, s.price),
    next_pos
  )
  returning * into r;

  return r;
end;
$$;


ALTER FUNCTION "public"."invoice_add_item_from_service"("p_invoice_id" "uuid", "p_service_id" "uuid", "p_qty" numeric, "p_unit_price" numeric, "p_description" "text", "p_position" integer) OWNER TO "postgres";

--
-- Name: invoices_next_no(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."invoices_next_no"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
declare y text := to_char(now(), 'YYYY');
declare n bigint;
begin
  n := nextval('invoices_no_seq');
  return format('INV-%s-%05s', y, n);
end$$;


ALTER FUNCTION "public"."invoices_next_no"() OWNER TO "postgres";

--
-- Name: is_admin("uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."is_admin"("uid" "uuid" DEFAULT "auth"."uid"()) RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = uid
      AND (
        p.main_role::text = ANY (ARRAY['owner','admin']::text[])
        OR 'owner' = ANY (COALESCE(p.staff_role::text[], ARRAY[]::text[]))
        OR 'admin' = ANY (COALESCE(p.staff_role::text[], ARRAY[]::text[]))
      )
  );
$$;


ALTER FUNCTION "public"."is_admin"("uid" "uuid") OWNER TO "postgres";

--
-- Name: is_admin_or_owner(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."is_admin_or_owner"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT public._is_admin_or_owner(auth.uid());
$$;


ALTER FUNCTION "public"."is_admin_or_owner"() OWNER TO "postgres";

--
-- Name: is_admin_or_owner("uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."is_admin_or_owner"("uid" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT public._is_admin_or_owner(uid);
$$;


ALTER FUNCTION "public"."is_admin_or_owner"("uid" "uuid") OWNER TO "postgres";

--
-- Name: is_assigned_to_project("uuid", "uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."is_assigned_to_project"("uid" "uuid", "pid" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.assignments a
    WHERE a.user_id = uid
      AND a.project_id = pid
      AND COALESCE(a.active, true)
  );
$$;


ALTER FUNCTION "public"."is_assigned_to_project"("uid" "uuid", "pid" "uuid") OWNER TO "postgres";

--
-- Name: next_invoice_no(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."next_invoice_no"() RETURNS "text"
    LANGUAGE "sql" STABLE
    AS $$
  select public.invoices_next_no();
$$;


ALTER FUNCTION "public"."next_invoice_no"() OWNER TO "postgres";

--
-- Name: progress_from_stage("public"."project_stage"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."progress_from_stage"("p_stage" "public"."project_stage") RETURNS numeric
    LANGUAGE "sql" IMMUTABLE
    AS $$
  SELECT CASE p_stage
    WHEN 'drafting'     THEN 10
    WHEN 'production'   THEN 40
    WHEN 'revision'     THEN 65
    WHEN 'mixing'       THEN 80
    WHEN 'mastering'    THEN 90
    WHEN 'distribution' THEN 100
    ELSE 0 END::numeric;
$$;


ALTER FUNCTION "public"."progress_from_stage"("p_stage" "public"."project_stage") OWNER TO "postgres";

--
-- Name: propagate_project_client_id_to_meetings(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."propagate_project_client_id_to_meetings"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if new.client_id is distinct from old.client_id then
    update public.meetings m
    set client_id = new.client_id
    where m.project_id = new.project_id;
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."propagate_project_client_id_to_meetings"() OWNER TO "postgres";

--
-- Name: purge_expired_operational_data(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."purge_expired_operational_data"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare privacy_count integer := 0; contact_count integer := 0;
begin
  delete from public.data_privacy_requests where status in ('completed','rejected','cancelled') and coalesce(completed_at, updated_at) < now() - interval '365 days';
  get diagnostics privacy_count = row_count;
  if to_regclass('public.contact_inquiries') is not null then
    delete from public.contact_inquiries where created_at < now() - interval '730 days';
    get diagnostics contact_count = row_count;
  end if;
  return jsonb_build_object('privacy_requests_deleted', privacy_count, 'contact_inquiries_deleted', contact_count, 'ran_at', now());
end;
$$;


ALTER FUNCTION "public"."purge_expired_operational_data"() OWNER TO "postgres";

--
-- Name: put_project_on_hold("uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."put_project_on_hold"("p_project_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare v_count integer := 0;
begin
  if not public.can_manage_project(p_project_id) then raise exception 'Project access denied' using errcode = '42501'; end if;
  update public.projects set status = 'on_hold', updated_at = now() where project_id = p_project_id;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;


ALTER FUNCTION "public"."put_project_on_hold"("p_project_id" "uuid") OWNER TO "postgres";

--
-- Name: recalc_invoice_total(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."recalc_invoice_total"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
declare v_invoice_id uuid;
begin
  if TG_OP = 'DELETE' then
    v_invoice_id := OLD.invoice_id;
  else
    v_invoice_id := NEW.invoice_id;
  end if;

  update public.invoices i
     set amount_total = coalesce((
       select sum((ii.qty::numeric) * (ii.unit_price::numeric))
         from public.invoice_items ii
        where ii.invoice_id = v_invoice_id
     ), 0)
   where i.id = v_invoice_id;

  -- AFTER row triggers can return NULL safely
  return null;
end;
$$;


ALTER FUNCTION "public"."recalc_invoice_total"() OWNER TO "postgres";

--
-- Name: resume_project("uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."resume_project"("p_project_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare v_count integer := 0;
begin
  if not public.can_manage_project(p_project_id) then raise exception 'Project access denied' using errcode = '42501'; end if;
  update public.projects set status = 'in_progress', updated_at = now() where project_id = p_project_id;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;


ALTER FUNCTION "public"."resume_project"("p_project_id" "uuid") OWNER TO "postgres";

--
-- Name: set_meeting_created_by(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."set_meeting_created_by"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if new.created_by is null then new.created_by := auth.uid(); end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."set_meeting_created_by"() OWNER TO "postgres";

--
-- Name: set_meetings_client_id_from_project(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."set_meetings_client_id_from_project"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  select p.client_id into new.client_id
  from public.projects p
  where p.project_id = new.project_id;

  if new.client_id is null then
    raise exception 'Project % tidak punya client_id; gagal set meetings.client_id', new.project_id;
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."set_meetings_client_id_from_project"() OWNER TO "postgres";

--
-- Name: set_ref_link_created_by(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."set_ref_link_created_by"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  if new.created_by is null then
    new.created_by := auth.uid();
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."set_ref_link_created_by"() OWNER TO "postgres";

--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at := now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";

--
-- Name: submit_project_request("uuid", "uuid", "jsonb", "jsonb", "jsonb"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."submit_project_request"("p_user_id" "uuid", "p_idempotency_key" "uuid", "p_project" "jsonb", "p_items" "jsonb", "p_references" "jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_project_id uuid;
begin
  select p.project_id into v_project_id
  from public.projects p
  where p.client_id = p_user_id and p.idempotency_key = p_idempotency_key;

  if v_project_id is not null then return v_project_id; end if;

  insert into public.projects (
    client_id, title, artist_name, album_title, genre, sub_genre,
    stage, status, description, budget_amount, budget_currency,
    payment_plan, start_date, deadline, delivery_format, nda_required,
    preferred_engineer_id, order_bundle_id, idempotency_key
  ) values (
    p_user_id,
    p_project->>'title',
    nullif(p_project->>'artist_name', ''),
    nullif(p_project->>'album_title', ''),
    nullif(p_project->>'genre', ''),
    nullif(p_project->>'sub_genre', ''),
    'drafting',
    'requested',
    p_project->>'description',
    (p_project->>'budget_amount')::numeric,
    'USD',
    p_project->>'payment_plan',
    nullif(p_project->>'start_date', '')::date,
    nullif(p_project->>'deadline', '')::date,
    array(select jsonb_array_elements_text(coalesce(p_project->'delivery_format', '[]'::jsonb))),
    coalesce((p_project->>'nda_required')::boolean, false),
    nullif(p_project->>'preferred_engineer_id', '')::uuid,
    nullif(p_project->>'order_bundle_id', '')::uuid,
    p_idempotency_key
  ) returning project_id into v_project_id;

  insert into public.project_order_items (
    project_id, service_id, service_key, label, unit_price, currency, included_in_bundle
  )
  select v_project_id, x.service_id, x.service_key, x.label, x.unit_price, 'USD', x.included_in_bundle
  from jsonb_to_recordset(coalesce(p_items, '[]'::jsonb)) as x(
    service_id uuid, service_key text, label text, unit_price numeric,
    currency text, included_in_bundle boolean
  );

  insert into public.project_reference_links(project_id, url)
  select v_project_id, value
  from jsonb_array_elements_text(coalesce(p_references, '[]'::jsonb));

  return v_project_id;
exception
  when unique_violation then
    select p.project_id into v_project_id
    from public.projects p
    where p.client_id = p_user_id and p.idempotency_key = p_idempotency_key;
    if v_project_id is not null then return v_project_id; end if;
    raise;
end;
$$;


ALTER FUNCTION "public"."submit_project_request"("p_user_id" "uuid", "p_idempotency_key" "uuid", "p_project" "jsonb", "p_items" "jsonb", "p_references" "jsonb") OWNER TO "postgres";

--
-- Name: sync_terms_consent_from_auth(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."sync_terms_consent_from_auth"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  update public.profiles set
    terms_version = nullif(new.raw_user_meta_data ->> 'terms_version', ''),
    terms_accepted_at = case when coalesce(new.raw_user_meta_data ->> 'terms_accepted_at', '') ~ '^\\d{4}-\\d{2}-\\d{2}T' then (new.raw_user_meta_data ->> 'terms_accepted_at')::timestamptz else terms_accepted_at end
  where id = new.id;
  return new;
end;
$$;


ALTER FUNCTION "public"."sync_terms_consent_from_auth"() OWNER TO "postgres";

--
-- Name: trigger_set_timestamp(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."trigger_set_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."trigger_set_timestamp"() OWNER TO "postgres";

--
-- Name: validate_assignment_matches_staff_role(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."validate_assignment_matches_staff_role"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  -- pastikan user memang punya role yang akan di-assign
  if not exists (
    select 1 from public.profiles p
    where p.id = new.user_id
      and p.staff_role @> array[new.role]
  ) then
    raise exception 'User % tidak memiliki staff role %', new.user_id, new.role;
  end if;
  return new;
end $$;


ALTER FUNCTION "public"."validate_assignment_matches_staff_role"() OWNER TO "postgres";

--
-- Name: app_error_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."app_error_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "error_name" "text" NOT NULL,
    "message" "text" NOT NULL,
    "digest" "text",
    "path" "text",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."app_error_events" OWNER TO "postgres";

--
-- Name: assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."assignments" (
    "assignment_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "assigned_by" "uuid",
    "assigned_at" timestamp with time zone DEFAULT "now"(),
    "role" "public"."staff_role" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "unassigned_at" timestamp with time zone,
    "note" "text"
);


ALTER TABLE "public"."assignments" OWNER TO "postgres";

--
-- Name: profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."profiles" (
    "id" "uuid" NOT NULL,
    "name" "text",
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "first_name" "text",
    "last_name" "text",
    "artist_name" "text",
    "location" "text",
    "phone_number" "text",
    "avatar_path" "text",
    "email" "text",
    "staff_role" "public"."staff_role"[] DEFAULT '{}'::"public"."staff_role"[] NOT NULL,
    "main_role" "public"."global_role" DEFAULT 'client'::"public"."global_role",
    "username" "text" DEFAULT ''::"text",
    "terms_version" "text",
    "terms_accepted_at" timestamp with time zone
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";

--
-- Name: assignment_view; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW "public"."assignment_view" AS
 SELECT "a"."assignment_id",
    "a"."project_id",
    "a"."assigned_by",
    "a"."assigned_at",
    "a"."role",
    "a"."user_id",
    "a"."active",
    "a"."unassigned_at",
    "a"."note",
    "p"."first_name" AS "staff_first_name"
   FROM ("public"."assignments" "a"
     LEFT JOIN "public"."profiles" "p" ON (("a"."user_id" = "p"."id")));


ALTER VIEW "public"."assignment_view" OWNER TO "postgres";

--
-- Name: bundle_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."bundle_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "bundle_id" "uuid" NOT NULL,
    "service_id" "uuid" NOT NULL
);


ALTER TABLE "public"."bundle_items" OWNER TO "postgres";

--
-- Name: bundles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."bundles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "bundle_key" "text" NOT NULL,
    "label" "text" NOT NULL,
    "bundle_price" numeric NOT NULL,
    "note" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "description" "text",
    "promo_type" "text" DEFAULT 'none'::"text" NOT NULL,
    "promo_value" numeric DEFAULT 0 NOT NULL,
    "promo_start" timestamp with time zone,
    "promo_end" timestamp with time zone,
    CONSTRAINT "bundles_bundle_price_check" CHECK (("bundle_price" >= (0)::numeric)),
    CONSTRAINT "bundles_promo_type_check" CHECK (("promo_type" = ANY (ARRAY['none'::"text", 'percentage'::"text", 'flat'::"text"]))),
    CONSTRAINT "bundles_promo_value_check" CHECK (("promo_value" >= (0)::numeric))
);


ALTER TABLE "public"."bundles" OWNER TO "postgres";

--
-- Name: clients; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW "public"."clients" AS
 SELECT "id",
    COALESCE(NULLIF("btrim"("concat_ws"(' '::"text", "first_name", "last_name")), ''::"text"), "email") AS "name",
    "email",
    true AS "is_active"
   FROM "public"."profiles" "p";


ALTER VIEW "public"."clients" OWNER TO "postgres";

--
-- Name: VIEW "clients"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW "public"."clients" IS 'Derived clients view from profiles (name = first_name + last_name, fallback email)';


--
-- Name: contact_inquiries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."contact_inquiries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "company" "text",
    "reason" "text" NOT NULL,
    "subject" "text" NOT NULL,
    "message" "text" NOT NULL,
    "status" "text" DEFAULT 'new'::"text" NOT NULL,
    "ip_hash" "text",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "contact_inquiries_email_check" CHECK (("char_length"("email") <= 254)),
    CONSTRAINT "contact_inquiries_message_check" CHECK ((("char_length"("message") >= 20) AND ("char_length"("message") <= 2000))),
    CONSTRAINT "contact_inquiries_name_check" CHECK ((("char_length"("name") >= 2) AND ("char_length"("name") <= 120))),
    CONSTRAINT "contact_inquiries_reason_check" CHECK (("reason" = ANY (ARRAY['project'::"text", 'partnership'::"text", 'publishing'::"text", 'press'::"text", 'support'::"text", 'other'::"text"]))),
    CONSTRAINT "contact_inquiries_status_check" CHECK (("status" = ANY (ARRAY['new'::"text", 'reviewing'::"text", 'replied'::"text", 'closed'::"text", 'spam'::"text"]))),
    CONSTRAINT "contact_inquiries_subject_check" CHECK ((("char_length"("subject") >= 3) AND ("char_length"("subject") <= 180)))
);


ALTER TABLE "public"."contact_inquiries" OWNER TO "postgres";

--
-- Name: data_privacy_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."data_privacy_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "request_type" "text" NOT NULL,
    "request_email" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "resolution_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone,
    CONSTRAINT "data_privacy_requests_request_type_check" CHECK (("request_type" = ANY (ARRAY['export'::"text", 'delete'::"text"]))),
    CONSTRAINT "data_privacy_requests_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'identity_verification'::"text", 'processing'::"text", 'completed'::"text", 'rejected'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."data_privacy_requests" OWNER TO "postgres";

--
-- Name: data_retention_rules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."data_retention_rules" (
    "data_category" "text" NOT NULL,
    "retention_days" integer NOT NULL,
    "legal_basis" "text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "data_retention_rules_retention_days_check" CHECK (("retention_days" > 0))
);


ALTER TABLE "public"."data_retention_rules" OWNER TO "postgres";

--
-- Name: discussion_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."discussion_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "author_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "deleted_by" "uuid",
    "updated_at" timestamp with time zone,
    CONSTRAINT "discussion_messages_content_check" CHECK (("char_length"(TRIM(BOTH FROM "content")) > 0))
);

ALTER TABLE ONLY "public"."discussion_messages" REPLICA IDENTITY FULL;


ALTER TABLE "public"."discussion_messages" OWNER TO "postgres";

--
-- Name: discussion_messages_view; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW "public"."discussion_messages_view" AS
 SELECT "m"."id",
    "m"."project_id",
    "m"."author_id",
    "m"."content",
    "m"."created_at",
    "m"."deleted_at",
    COALESCE(NULLIF(TRIM(BOTH FROM ((COALESCE("p"."first_name", ''::"text") || ' '::"text") || COALESCE("p"."last_name", ''::"text"))), ''::"text"), NULLIF(TRIM(BOTH FROM "p"."username"), ''::"text"), ("m"."author_id")::"text") AS "author_display_name",
    "m"."updated_at"
   FROM ("public"."discussion_messages" "m"
     LEFT JOIN "public"."profiles" "p" ON (("p"."id" = "m"."author_id")));


ALTER VIEW "public"."discussion_messages_view" OWNER TO "postgres";

--
-- Name: distributions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."distributions" (
    "distribution_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "publisher_id" "uuid",
    "release_date" "date",
    "status" "text" DEFAULT 'scheduled'::"text",
    CONSTRAINT "distributions_status_check" CHECK (("status" = ANY (ARRAY['scheduled'::"text", 'released'::"text", 'completed'::"text"])))
);


ALTER TABLE "public"."distributions" OWNER TO "postgres";

--
-- Name: drafts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."drafts" (
    "draft_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "file_path" "text" NOT NULL,
    "uploaded_by" "uuid",
    "version" integer DEFAULT 1 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "category" "public"."draft_category" DEFAULT 'mixing'::"public"."draft_category" NOT NULL
);


ALTER TABLE "public"."drafts" OWNER TO "postgres";

--
-- Name: feedbacks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."feedbacks" (
    "feedback_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "draft_id" "uuid" NOT NULL,
    "given_by" "uuid",
    "to_user_id" "uuid",
    "comment" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."feedbacks" OWNER TO "postgres";

--
-- Name: music_genres; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."music_genres" (
    "id" integer NOT NULL,
    "genre" character varying(100) NOT NULL,
    "sub_genre" character varying(150) NOT NULL,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."music_genres" OWNER TO "postgres";

--
-- Name: TABLE "music_genres"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."music_genres" IS 'Comprehensive database of music genres and sub-genres';


--
-- Name: COLUMN "music_genres"."genre"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."music_genres"."genre" IS 'Main genre category';


--
-- Name: COLUMN "music_genres"."sub_genre"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."music_genres"."sub_genre" IS 'Specific sub-genre or style within the main genre';


--
-- Name: genre_summary; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW "public"."genre_summary" AS
 SELECT "genre",
    "count"(*) AS "sub_genre_count",
    "string_agg"(("sub_genre")::"text", ', '::"text" ORDER BY ("sub_genre")::"text") AS "sub_genres"
   FROM "public"."music_genres"
  GROUP BY "genre"
  ORDER BY "genre";


ALTER VIEW "public"."genre_summary" OWNER TO "postgres";

--
-- Name: invoice_delivery_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."invoice_delivery_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invoice_id" "uuid" NOT NULL,
    "recipient_email" "text" NOT NULL,
    "delivery_type" "text" DEFAULT 'reminder'::"text" NOT NULL,
    "status" "text" DEFAULT 'queued'::"text" NOT NULL,
    "template_version" "text" NOT NULL,
    "provider_message_id" "text",
    "attempt_count" integer DEFAULT 0 NOT NULL,
    "error_message" "text",
    "tracking_token" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "last_attempt_at" timestamp with time zone,
    "next_retry_at" timestamp with time zone,
    "sent_at" timestamp with time zone,
    "opened_at" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "invoice_delivery_status_check" CHECK (("status" = ANY (ARRAY['queued'::"text", 'sent'::"text", 'failed'::"text", 'opened'::"text"]))),
    CONSTRAINT "invoice_delivery_type_check" CHECK (("delivery_type" = ANY (ARRAY['invoice'::"text", 'reminder'::"text", 'overdue'::"text"])))
);


ALTER TABLE "public"."invoice_delivery_logs" OWNER TO "postgres";

--
-- Name: invoices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."invoices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invoice_no" "text" DEFAULT "public"."invoices_next_no"() NOT NULL,
    "client_name" "text",
    "amount_total" numeric,
    "currency" "text" DEFAULT 'IDR'::"text",
    "status" "public"."invoice_status" DEFAULT 'draft'::"public"."invoice_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "project_id" "uuid",
    "issue_date" "date" DEFAULT CURRENT_DATE,
    "due_date" "date",
    "notes" "text",
    "client_email" "text",
    "payment_url" "text",
    "client_id" "uuid"
);


ALTER TABLE "public"."invoices" OWNER TO "postgres";

--
-- Name: invoices_no_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE "public"."invoices_no_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."invoices_no_seq" OWNER TO "postgres";

--
-- Name: meetings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."meetings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "start_at" timestamp with time zone NOT NULL,
    "duration_min" integer DEFAULT 60 NOT NULL,
    "link" "text",
    "notes" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "client_id" "uuid" NOT NULL
);

ALTER TABLE ONLY "public"."meetings" REPLICA IDENTITY FULL;


ALTER TABLE "public"."meetings" OWNER TO "postgres";

--
-- Name: music_genres_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE "public"."music_genres_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."music_genres_id_seq" OWNER TO "postgres";

--
-- Name: music_genres_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE "public"."music_genres_id_seq" OWNED BY "public"."music_genres"."id";


--
-- Name: payment_schedules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."payment_schedules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "milestone_id" "uuid",
    "label" "text" NOT NULL,
    "amount" numeric(14,2) NOT NULL,
    "currency" "text" DEFAULT 'IDR'::"text" NOT NULL,
    "due_date" "date",
    "status" "text" DEFAULT 'unpaid'::"text" NOT NULL,
    "provider" "text",
    "external_id" "text",
    "payment_link" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."payment_schedules" OWNER TO "postgres";

--
-- Name: payment_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."payment_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "schedule_id" "uuid" NOT NULL,
    "amount" numeric(14,2) NOT NULL,
    "currency" "text" DEFAULT 'IDR'::"text" NOT NULL,
    "provider" "text" NOT NULL,
    "external_id" "text" NOT NULL,
    "status" "text" NOT NULL,
    "paid_at" timestamp with time zone,
    "raw" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."payment_transactions" OWNER TO "postgres";

--
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."payments" (
    "payment_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "amount" numeric(14,2) NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "payment_date" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "payments_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'success'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."payments" OWNER TO "postgres";

--
-- Name: portfolio; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."portfolio" (
    "id" integer NOT NULL,
    "genre" character varying(100),
    "song_title" character varying(255) NOT NULL,
    "album_title" character varying(255),
    "singer" "text"[],
    "songwriter" "text"[],
    "composer" "text"[],
    "arranger" "text"[],
    "producer" "text"[],
    "mixing_engineer" "text"[],
    "mastering_engineer" "text"[],
    "publisher" "text"[],
    "aggregator" "text"[],
    "release_date_aggregator" "date",
    "spotify_link" "text",
    "youtube_link" "text",
    "apple_music_link" "text",
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "isrc_code" character varying(20),
    "iswc_code" character varying(20),
    "upc_code" character varying(20),
    "duration_seconds" integer,
    "bpm" integer,
    "key_signature" character varying(10),
    "language" character varying(50),
    "explicit" boolean DEFAULT false,
    "lyrics" "text",
    "mood" "text"[],
    "theme" "text"[],
    "copyright_owner" "text"[],
    "phonographic_copyright_owner" "text"[],
    "collecting_society" "text"[],
    "rights_holder" "text"[],
    "licensing_info" "text",
    "distributor" "text"[],
    "platforms" "text"[],
    "release_country" "text"[],
    "release_type" character varying(50),
    "format" character varying(50),
    "artwork_link" "text",
    "registered_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "last_updated" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "is_featured" boolean DEFAULT false,
    "priority_order" integer,
    "work_type" "text"[] DEFAULT ARRAY['release'::"text"] NOT NULL,
    "client_brief" "text",
    "challenge" "text",
    "arrangement_solution" "text",
    "before_url" "text",
    "after_url" "text",
    "turnaround_days" integer,
    "revision_count" integer,
    "deliverables" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "testimonial_quote" "text",
    "testimonial_name" "text",
    CONSTRAINT "portfolio_revision_count_check" CHECK ((("revision_count" IS NULL) OR (("revision_count" >= 0) AND ("revision_count" <= 50)))),
    CONSTRAINT "portfolio_turnaround_days_check" CHECK ((("turnaround_days" IS NULL) OR (("turnaround_days" >= 1) AND ("turnaround_days" <= 365))))
);


ALTER TABLE "public"."portfolio" OWNER TO "postgres";

--
-- Name: portfolio_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE "public"."portfolio_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."portfolio_id_seq" OWNER TO "postgres";

--
-- Name: portfolio_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE "public"."portfolio_id_seq" OWNED BY "public"."portfolio"."id";


--
-- Name: projects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."projects" (
    "project_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "status" "public"."project_status" DEFAULT 'pending'::"public"."project_status",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "stage" "public"."project_stage",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "artist_name" "text",
    "genre" "text",
    "progress_percent" numeric(5,2) DEFAULT 0,
    "budget_amount" numeric(14,2),
    "budget_currency" "text" DEFAULT 'IDR'::"text",
    "is_active" boolean GENERATED ALWAYS AS (("status" = ANY (ARRAY['in_progress'::"public"."project_status", 'unpaid'::"public"."project_status"]))) STORED,
    "is_finished" boolean GENERATED ALWAYS AS (("status" = ANY (ARRAY['approved'::"public"."project_status", 'published'::"public"."project_status"]))) STORED,
    "album_title" "text",
    "sub_genre" "text",
    "payment_plan" "public"."payment_plan_type",
    "start_date" timestamp with time zone,
    "deadline" timestamp with time zone,
    "delivery_format" "text",
    "isrc" "text",
    "upc" "text",
    "release_date" "date",
    "explicit" boolean DEFAULT false,
    "label_name" "text",
    "copyright_c" "text",
    "copyright_p" "text",
    "language" "text",
    "primary_genre" "text",
    "artwork_path" "text",
    "artwork_url" "text",
    "royalty_splits" "jsonb",
    "platform_statuses" "jsonb" DEFAULT '{}'::"jsonb",
    "invoice_id" "uuid",
    "nda_required" boolean DEFAULT false NOT NULL,
    "preferred_engineer_id" "uuid",
    "order_bundle_id" "uuid",
    "idempotency_key" "uuid",
    "publishing_submission_status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "publishing_last_validated_at" timestamp with time zone,
    "publishing_validation_errors" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    CONSTRAINT "projects_progress_percent_check" CHECK ((("progress_percent" >= (0)::numeric) AND ("progress_percent" <= (100)::numeric)))
);


ALTER TABLE "public"."projects" OWNER TO "postgres";

--
-- Name: revisions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."revisions" (
    "revision_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "draft_id" "uuid" NOT NULL,
    "requested_by" "uuid",
    "reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "project_id" "uuid" NOT NULL
);


ALTER TABLE "public"."revisions" OWNER TO "postgres";

--
-- Name: project_activity; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW "public"."project_activity" WITH ("security_invoker"='on') AS
 SELECT "p"."project_id",
    ('Draft uploaded v'::"text" || "d"."version") AS "action",
    'draft'::"text" AS "kind",
    "d"."created_at" AS "at",
    ( SELECT "profiles"."name"
           FROM "public"."profiles"
          WHERE ("profiles"."id" = "d"."uploaded_by")) AS "actor"
   FROM ("public"."projects" "p"
     JOIN "public"."drafts" "d" ON (("d"."project_id" = "p"."project_id")))
UNION ALL
 SELECT "p"."project_id",
    ('Feedback: '::"text" || "left"("f"."comment", 80)) AS "action",
    'feedback'::"text" AS "kind",
    "f"."created_at" AS "at",
    ( SELECT "profiles"."name"
           FROM "public"."profiles"
          WHERE ("profiles"."id" = "f"."given_by")) AS "actor"
   FROM (("public"."projects" "p"
     JOIN "public"."drafts" "d" ON (("d"."project_id" = "p"."project_id")))
     JOIN "public"."feedbacks" "f" ON (("f"."draft_id" = "d"."draft_id")))
UNION ALL
 SELECT "p"."project_id",
    'Revision requested'::"text" AS "action",
    'revision'::"text" AS "kind",
    "r"."created_at" AS "at",
    ( SELECT "profiles"."name"
           FROM "public"."profiles"
          WHERE ("profiles"."id" = "r"."requested_by")) AS "actor"
   FROM (("public"."projects" "p"
     JOIN "public"."drafts" "d" ON (("d"."project_id" = "p"."project_id")))
     JOIN "public"."revisions" "r" ON (("r"."draft_id" = "d"."draft_id")))
UNION ALL
 SELECT "p"."project_id",
    ((('Payment '::"text" || "pay"."status") || ' Rp '::"text") || ("pay"."amount")::"text") AS "action",
    'payment'::"text" AS "kind",
    "pay"."payment_date" AS "at",
    NULL::"text" AS "actor"
   FROM ("public"."projects" "p"
     JOIN "public"."payments" "pay" ON (("pay"."project_id" = "p"."project_id")))
UNION ALL
 SELECT "p"."project_id",
    ('Distribution '::"text" || "distr"."status") AS "action",
    'distribution'::"text" AS "kind",
    ("distr"."release_date")::timestamp with time zone AS "at",
    ( SELECT "profiles"."name"
           FROM "public"."profiles"
          WHERE ("profiles"."id" = "distr"."publisher_id")) AS "actor"
   FROM ("public"."projects" "p"
     JOIN "public"."distributions" "distr" ON (("distr"."project_id" = "p"."project_id")));


ALTER VIEW "public"."project_activity" OWNER TO "postgres";

--
-- Name: project_latest_update; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW "public"."project_latest_update" WITH ("security_invoker"='on') AS
 SELECT "project_id",
    GREATEST(COALESCE("updated_at", '1970-01-01 00:00:00+00'::timestamp with time zone), COALESCE(( SELECT "max"("d"."created_at") AS "max"
           FROM "public"."drafts" "d"
          WHERE ("d"."project_id" = "p"."project_id")), '1970-01-01 00:00:00+00'::timestamp with time zone), COALESCE(( SELECT "max"("f"."created_at") AS "max"
           FROM ("public"."feedbacks" "f"
             JOIN "public"."drafts" "dd" ON (("dd"."draft_id" = "f"."draft_id")))
          WHERE ("dd"."project_id" = "p"."project_id")), '1970-01-01 00:00:00+00'::timestamp with time zone), COALESCE(( SELECT "max"("r"."created_at") AS "max"
           FROM ("public"."revisions" "r"
             JOIN "public"."drafts" "dr" ON (("dr"."draft_id" = "r"."draft_id")))
          WHERE ("dr"."project_id" = "p"."project_id")), '1970-01-01 00:00:00+00'::timestamp with time zone), COALESCE(( SELECT "max"("pay"."payment_date") AS "max"
           FROM "public"."payments" "pay"
          WHERE ("pay"."project_id" = "p"."project_id")), '1970-01-01 00:00:00+00'::timestamp with time zone), COALESCE(( SELECT "max"(("distr"."release_date")::timestamp with time zone) AS "max"
           FROM "public"."distributions" "distr"
          WHERE ("distr"."project_id" = "p"."project_id")), '1970-01-01 00:00:00+00'::timestamp with time zone)) AS "latest_update"
   FROM "public"."projects" "p";


ALTER VIEW "public"."project_latest_update" OWNER TO "postgres";

--
-- Name: project_milestones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."project_milestones" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "due_date" "date",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "order_no" integer DEFAULT 1 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."project_milestones" OWNER TO "postgres";

--
-- Name: project_order_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."project_order_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "service_id" "uuid",
    "service_key" "text" NOT NULL,
    "label" "text" NOT NULL,
    "unit_price" numeric(14,2) NOT NULL,
    "currency" "text" DEFAULT 'USD'::"text" NOT NULL,
    "included_in_bundle" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "project_order_items_unit_price_check" CHECK (("unit_price" >= (0)::numeric))
);


ALTER TABLE "public"."project_order_items" OWNER TO "postgres";

--
-- Name: project_services; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."project_services" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "service_key" "text" NOT NULL,
    "service_label" "text" NOT NULL,
    "price" numeric DEFAULT 0 NOT NULL,
    "is_subscription" boolean DEFAULT false NOT NULL,
    "in_bundle" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."project_services" OWNER TO "postgres";

--
-- Name: project_summary; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW "public"."project_summary" WITH ("security_invoker"='on') AS
 SELECT "p"."project_id",
    "p"."title",
    "p"."status",
    "p"."stage",
    "p"."updated_at",
    "p"."client_id",
    "p"."artist_name",
    "p"."genre",
    "p"."progress_percent",
    ( SELECT "a"."user_id"
           FROM "public"."assignments" "a"
          WHERE (("a"."project_id" = "p"."project_id") AND ("a"."role" = 'composer'::"public"."staff_role") AND "a"."active")
         LIMIT 1) AS "composer_id",
    ( SELECT "a"."user_id"
           FROM "public"."assignments" "a"
          WHERE (("a"."project_id" = "p"."project_id") AND ("a"."role" = 'producer'::"public"."staff_role") AND "a"."active")
         LIMIT 1) AS "producer_id",
    ( SELECT "a"."user_id"
           FROM "public"."assignments" "a"
          WHERE (("a"."project_id" = "p"."project_id") AND ("a"."role" = 'anr'::"public"."staff_role") AND "a"."active")
         LIMIT 1) AS "anr_id",
    ( SELECT "a"."user_id"
           FROM "public"."assignments" "a"
          WHERE (("a"."project_id" = "p"."project_id") AND ("a"."role" = 'engineer'::"public"."staff_role") AND "a"."active")
         LIMIT 1) AS "engineer_id",
    "pr"."first_name" AS "client_first_name",
    "pr"."last_name" AS "client_last_name",
    "pr"."avatar_path" AS "client_avatar_path",
    "pr"."email" AS "client_email",
    "pr"."phone_number" AS "client_phone_number",
    "pr"."location" AS "client_location",
    "p"."is_active",
    "p"."is_finished",
    "pr"."avatar_url" AS "client_avatar_url",
    ( SELECT "a"."user_id"
           FROM "public"."assignments" "a"
          WHERE (("a"."project_id" = "p"."project_id") AND ("a"."role" = 'publisher'::"public"."staff_role") AND "a"."active")
         LIMIT 1) AS "publisher_id",
    "p"."description",
    "pr"."name" AS "client_name"
   FROM ("public"."projects" "p"
     LEFT JOIN "public"."profiles" "pr" ON (("pr"."id" = "p"."client_id")));


ALTER VIEW "public"."project_summary" OWNER TO "postgres";

--
-- Name: publishing_analytics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."publishing_analytics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "platform" "text" NOT NULL,
    "period_start" "date" NOT NULL,
    "period_end" "date" NOT NULL,
    "streams" bigint DEFAULT 0 NOT NULL,
    "listeners" bigint DEFAULT 0 NOT NULL,
    "revenue_amount" numeric(14,2) DEFAULT 0 NOT NULL,
    "revenue_currency" "text" DEFAULT 'USD'::"text" NOT NULL,
    "source" "text" DEFAULT 'manual'::"text" NOT NULL,
    "synced_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "publishing_analytics_nonnegative_check" CHECK ((("streams" >= 0) AND ("listeners" >= 0) AND ("revenue_amount" >= (0)::numeric))),
    CONSTRAINT "publishing_analytics_period_check" CHECK (("period_end" >= "period_start"))
);


ALTER TABLE "public"."publishing_analytics" OWNER TO "postgres";

--
-- Name: publishing_delivery_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."publishing_delivery_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "distributor" "text",
    "status" "text" DEFAULT 'queued'::"text" NOT NULL,
    "request_payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "response_payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "error_message" "text",
    "attempt_count" integer DEFAULT 0 NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "publishing_delivery_status_check" CHECK (("status" = ANY (ARRAY['queued'::"text", 'submitted'::"text", 'accepted'::"text", 'live'::"text", 'rejected'::"text", 'takedown'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."publishing_delivery_logs" OWNER TO "postgres";

--
-- Name: reference_links; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."reference_links" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "url" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "note" "text",
    CONSTRAINT "reference_links_url_check" CHECK ((("left"("url", 7) = 'http://'::"text") OR ("left"("url", 8) = 'https://'::"text")))
);


ALTER TABLE "public"."reference_links" OWNER TO "postgres";

--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."roles" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text"
);


ALTER TABLE "public"."roles" OWNER TO "postgres";

--
-- Name: services; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."services" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "service_key" "text" NOT NULL,
    "label" "text" NOT NULL,
    "group_name" "text" NOT NULL,
    "price" numeric NOT NULL,
    "is_subscription" boolean DEFAULT false NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "description" "text",
    "promo_type" "text" DEFAULT 'none'::"text" NOT NULL,
    "promo_value" numeric DEFAULT 0 NOT NULL,
    "promo_start" timestamp with time zone,
    "promo_end" timestamp with time zone,
    CONSTRAINT "services_group_name_check" CHECK (("group_name" = ANY (ARRAY['core'::"text", 'additional'::"text", 'business'::"text"]))),
    CONSTRAINT "services_price_check" CHECK (("price" >= (0)::numeric)),
    CONSTRAINT "services_promo_type_check" CHECK (("promo_type" = ANY (ARRAY['none'::"text", 'percentage'::"text", 'flat'::"text"]))),
    CONSTRAINT "services_promo_value_check" CHECK (("promo_value" >= (0)::numeric))
);


ALTER TABLE "public"."services" OWNER TO "postgres";

--
-- Name: staff_list; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW "public"."staff_list" AS
 SELECT "id",
    "first_name",
    "last_name",
    "email",
    "main_role",
    "staff_role",
    TRIM(BOTH FROM "concat"(COALESCE("first_name", ''::"text"), ' ', COALESCE("last_name", ''::"text"))) AS "full_name",
    ('anr'::"public"."staff_role" = ANY ("staff_role")) AS "is_anr",
    ('composer'::"public"."staff_role" = ANY ("staff_role")) AS "is_composer",
    ('producer'::"public"."staff_role" = ANY ("staff_role")) AS "is_producer",
    ('engineer'::"public"."staff_role" = ANY ("staff_role")) AS "is_engineer",
    ('publisher'::"public"."staff_role" = ANY ("staff_role")) AS "is_publisher"
   FROM "public"."profiles" "p"
  WHERE ("cardinality"("staff_role") > 0);


ALTER VIEW "public"."staff_list" OWNER TO "postgres";

--
-- Name: music_genres id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."music_genres" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."music_genres_id_seq"'::"regclass");


--
-- Name: portfolio id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."portfolio" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."portfolio_id_seq"'::"regclass");


--
-- Name: app_error_events app_error_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."app_error_events"
    ADD CONSTRAINT "app_error_events_pkey" PRIMARY KEY ("id");


--
-- Name: assignments assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."assignments"
    ADD CONSTRAINT "assignments_pkey" PRIMARY KEY ("assignment_id");


--
-- Name: bundle_items bundle_items_bundle_id_service_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."bundle_items"
    ADD CONSTRAINT "bundle_items_bundle_id_service_id_key" UNIQUE ("bundle_id", "service_id");


--
-- Name: bundle_items bundle_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."bundle_items"
    ADD CONSTRAINT "bundle_items_pkey" PRIMARY KEY ("id");


--
-- Name: bundles bundles_bundle_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."bundles"
    ADD CONSTRAINT "bundles_bundle_key_key" UNIQUE ("bundle_key");


--
-- Name: bundles bundles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."bundles"
    ADD CONSTRAINT "bundles_pkey" PRIMARY KEY ("id");


--
-- Name: contact_inquiries contact_inquiries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."contact_inquiries"
    ADD CONSTRAINT "contact_inquiries_pkey" PRIMARY KEY ("id");


--
-- Name: data_privacy_requests data_privacy_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."data_privacy_requests"
    ADD CONSTRAINT "data_privacy_requests_pkey" PRIMARY KEY ("id");


--
-- Name: data_retention_rules data_retention_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."data_retention_rules"
    ADD CONSTRAINT "data_retention_rules_pkey" PRIMARY KEY ("data_category");


--
-- Name: discussion_messages discussion_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."discussion_messages"
    ADD CONSTRAINT "discussion_messages_pkey" PRIMARY KEY ("id");


--
-- Name: distributions distributions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."distributions"
    ADD CONSTRAINT "distributions_pkey" PRIMARY KEY ("distribution_id");


--
-- Name: drafts drafts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."drafts"
    ADD CONSTRAINT "drafts_pkey" PRIMARY KEY ("draft_id");


--
-- Name: feedbacks feedbacks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."feedbacks"
    ADD CONSTRAINT "feedbacks_pkey" PRIMARY KEY ("feedback_id");


--
-- Name: invoice_delivery_logs invoice_delivery_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."invoice_delivery_logs"
    ADD CONSTRAINT "invoice_delivery_logs_pkey" PRIMARY KEY ("id");


--
-- Name: invoice_delivery_logs invoice_delivery_logs_tracking_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."invoice_delivery_logs"
    ADD CONSTRAINT "invoice_delivery_logs_tracking_token_key" UNIQUE ("tracking_token");


--
-- Name: invoice_items invoice_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."invoice_items"
    ADD CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id");


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_pkey" PRIMARY KEY ("id");


--
-- Name: meetings meetings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."meetings"
    ADD CONSTRAINT "meetings_pkey" PRIMARY KEY ("id");


--
-- Name: music_genres music_genres_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."music_genres"
    ADD CONSTRAINT "music_genres_pkey" PRIMARY KEY ("id");


--
-- Name: payment_schedules payment_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."payment_schedules"
    ADD CONSTRAINT "payment_schedules_pkey" PRIMARY KEY ("id");


--
-- Name: payment_transactions payment_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."payment_transactions"
    ADD CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id");


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("payment_id");


--
-- Name: portfolio portfolio_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."portfolio"
    ADD CONSTRAINT "portfolio_pkey" PRIMARY KEY ("id");


--
-- Name: profiles profiles_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");


--
-- Name: project_milestones project_milestones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."project_milestones"
    ADD CONSTRAINT "project_milestones_pkey" PRIMARY KEY ("id");


--
-- Name: project_order_items project_order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."project_order_items"
    ADD CONSTRAINT "project_order_items_pkey" PRIMARY KEY ("id");


--
-- Name: project_order_items project_order_items_project_id_service_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."project_order_items"
    ADD CONSTRAINT "project_order_items_project_id_service_key_key" UNIQUE ("project_id", "service_key");


--
-- Name: project_services project_services_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."project_services"
    ADD CONSTRAINT "project_services_pkey" PRIMARY KEY ("id");


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("project_id");


--
-- Name: publishing_analytics publishing_analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."publishing_analytics"
    ADD CONSTRAINT "publishing_analytics_pkey" PRIMARY KEY ("id");


--
-- Name: publishing_analytics publishing_analytics_project_id_platform_period_start_perio_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."publishing_analytics"
    ADD CONSTRAINT "publishing_analytics_project_id_platform_period_start_perio_key" UNIQUE ("project_id", "platform", "period_start", "period_end");


--
-- Name: publishing_delivery_logs publishing_delivery_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."publishing_delivery_logs"
    ADD CONSTRAINT "publishing_delivery_logs_pkey" PRIMARY KEY ("id");


--
-- Name: reference_links reference_links_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."reference_links"
    ADD CONSTRAINT "reference_links_pkey" PRIMARY KEY ("id");


--
-- Name: revisions revisions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."revisions"
    ADD CONSTRAINT "revisions_pkey" PRIMARY KEY ("revision_id");


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."services"
    ADD CONSTRAINT "services_pkey" PRIMARY KEY ("id");


--
-- Name: services services_service_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."services"
    ADD CONSTRAINT "services_service_key_key" UNIQUE ("service_key");


--
-- Name: app_error_events_created_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "app_error_events_created_idx" ON "public"."app_error_events" USING "btree" ("created_at" DESC);


--
-- Name: data_privacy_requests_user_created_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "data_privacy_requests_user_created_idx" ON "public"."data_privacy_requests" USING "btree" ("user_id", "created_at" DESC);


--
-- Name: idx_assignments_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_assignments_active" ON "public"."assignments" USING "btree" ("active");


--
-- Name: idx_assignments_proj_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_assignments_proj_user" ON "public"."assignments" USING "btree" ("project_id", "user_id");


--
-- Name: idx_assignments_project; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_assignments_project" ON "public"."assignments" USING "btree" ("project_id");


--
-- Name: idx_assignments_project_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_assignments_project_active" ON "public"."assignments" USING "btree" ("project_id", "active");


--
-- Name: idx_assignments_project_active_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_assignments_project_active_role" ON "public"."assignments" USING "btree" ("project_id", "active", "role");


--
-- Name: idx_assignments_project_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_assignments_project_at" ON "public"."assignments" USING "btree" ("project_id", "assigned_at" DESC);


--
-- Name: idx_assignments_project_role_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_assignments_project_role_active" ON "public"."assignments" USING "btree" ("project_id", "role") WHERE "active";


--
-- Name: idx_assignments_project_user_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_assignments_project_user_active" ON "public"."assignments" USING "btree" ("project_id", "user_id") WHERE "active";


--
-- Name: idx_assignments_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_assignments_role" ON "public"."assignments" USING "btree" ("role");


--
-- Name: idx_assignments_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_assignments_user" ON "public"."assignments" USING "btree" ("user_id");


--
-- Name: idx_assignments_user_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_assignments_user_active" ON "public"."assignments" USING "btree" ("user_id") WHERE "active";


--
-- Name: idx_bundles_active_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_bundles_active_order" ON "public"."bundles" USING "btree" ("is_active" DESC, "sort_order", "label");


--
-- Name: idx_discussion_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_discussion_created_at" ON "public"."discussion_messages" USING "btree" ("created_at");


--
-- Name: idx_discussion_project; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_discussion_project" ON "public"."discussion_messages" USING "btree" ("project_id");


--
-- Name: idx_distributions_project_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_distributions_project_date" ON "public"."distributions" USING "btree" ("project_id", "release_date" DESC);


--
-- Name: idx_drafts_proj; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_drafts_proj" ON "public"."drafts" USING "btree" ("project_id");


--
-- Name: idx_drafts_project_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_drafts_project_at" ON "public"."drafts" USING "btree" ("project_id", "created_at" DESC);


--
-- Name: idx_drafts_project_category_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_drafts_project_category_at" ON "public"."drafts" USING "btree" ("project_id", "category", "created_at" DESC);


--
-- Name: idx_feedbacks_draft_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_feedbacks_draft_at" ON "public"."feedbacks" USING "btree" ("draft_id", "created_at" DESC);


--
-- Name: idx_genre; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_genre" ON "public"."music_genres" USING "btree" ("genre");


--
-- Name: idx_invoice_items_invoice; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_invoice_items_invoice" ON "public"."invoice_items" USING "btree" ("invoice_id", "position");


--
-- Name: idx_meetings_client_id_start_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_meetings_client_id_start_at" ON "public"."meetings" USING "btree" ("client_id", "start_at" DESC);


--
-- Name: idx_meetings_project_id_start_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_meetings_project_id_start_at" ON "public"."meetings" USING "btree" ("project_id", "start_at" DESC);


--
-- Name: idx_payment_schedules_milestone; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_payment_schedules_milestone" ON "public"."payment_schedules" USING "btree" ("milestone_id");


--
-- Name: idx_payment_schedules_project; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_payment_schedules_project" ON "public"."payment_schedules" USING "btree" ("project_id");


--
-- Name: idx_payment_tx_schedule; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_payment_tx_schedule" ON "public"."payment_transactions" USING "btree" ("schedule_id");


--
-- Name: idx_payments_project_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_payments_project_date" ON "public"."payments" USING "btree" ("project_id", "payment_date" DESC);


--
-- Name: idx_portfolio_featured; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_portfolio_featured" ON "public"."portfolio" USING "btree" ("is_featured");


--
-- Name: idx_portfolio_priority; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_portfolio_priority" ON "public"."portfolio" USING "btree" ("priority_order");


--
-- Name: idx_profiles_roles_gin; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_profiles_roles_gin" ON "public"."profiles" USING "gin" ("staff_role");


--
-- Name: idx_profiles_staff_roles_gin; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_profiles_staff_roles_gin" ON "public"."profiles" USING "gin" ("staff_role");


--
-- Name: idx_project_milestones_project; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_project_milestones_project" ON "public"."project_milestones" USING "btree" ("project_id", "order_no");


--
-- Name: idx_projects_deadline; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_projects_deadline" ON "public"."projects" USING "btree" ("deadline");


--
-- Name: idx_projects_payment_plan; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_projects_payment_plan" ON "public"."projects" USING "btree" ("payment_plan");


--
-- Name: idx_projects_release_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_projects_release_date" ON "public"."projects" USING "btree" ("release_date");


--
-- Name: idx_projects_stage; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_projects_stage" ON "public"."projects" USING "btree" ("stage");


--
-- Name: idx_projects_start_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_projects_start_date" ON "public"."projects" USING "btree" ("start_date");


--
-- Name: idx_projects_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_projects_status" ON "public"."projects" USING "btree" ("status");


--
-- Name: idx_projects_status_client; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_projects_status_client" ON "public"."projects" USING "btree" ("status", "client_id");


--
-- Name: idx_projects_updated_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_projects_updated_at" ON "public"."projects" USING "btree" ("updated_at" DESC);


--
-- Name: idx_reference_links_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_reference_links_created_at" ON "public"."reference_links" USING "btree" ("created_at" DESC);


--
-- Name: idx_reference_links_project; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_reference_links_project" ON "public"."reference_links" USING "btree" ("project_id");


--
-- Name: idx_services_active_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_services_active_order" ON "public"."services" USING "btree" ("is_active" DESC, "group_name", "sort_order", "label");


--
-- Name: idx_sub_genre; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_sub_genre" ON "public"."music_genres" USING "btree" ("sub_genre");


--
-- Name: invoice_delivery_invoice_created_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "invoice_delivery_invoice_created_idx" ON "public"."invoice_delivery_logs" USING "btree" ("invoice_id", "created_at" DESC);


--
-- Name: invoice_delivery_retry_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "invoice_delivery_retry_idx" ON "public"."invoice_delivery_logs" USING "btree" ("status", "next_retry_at") WHERE ("status" = 'failed'::"text");


--
-- Name: invoice_items_invoice_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "invoice_items_invoice_id_idx" ON "public"."invoice_items" USING "btree" ("invoice_id");


--
-- Name: invoice_items_service_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "invoice_items_service_id_idx" ON "public"."invoice_items" USING "btree" ("service_id");


--
-- Name: invoices_client_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "invoices_client_id_idx" ON "public"."invoices" USING "btree" ("client_id");


--
-- Name: invoices_client_name_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "invoices_client_name_idx" ON "public"."invoices" USING "btree" ("client_name");


--
-- Name: invoices_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "invoices_created_at_idx" ON "public"."invoices" USING "btree" ("created_at" DESC);


--
-- Name: invoices_invoice_no_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "invoices_invoice_no_idx" ON "public"."invoices" USING "btree" ("invoice_no");


--
-- Name: invoices_invoice_no_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "invoices_invoice_no_key" ON "public"."invoices" USING "btree" ("invoice_no");


--
-- Name: invoices_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "invoices_status_idx" ON "public"."invoices" USING "btree" ("status");


--
-- Name: portfolio_public_order_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "portfolio_public_order_idx" ON "public"."portfolio" USING "btree" ("priority_order", "release_date_aggregator" DESC NULLS LAST);


--
-- Name: portfolio_work_type_gin_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "portfolio_work_type_gin_idx" ON "public"."portfolio" USING "gin" ("work_type");


--
-- Name: profiles_id_main_role_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "profiles_id_main_role_idx" ON "public"."profiles" USING "btree" ("id", "main_role");


--
-- Name: profiles_username_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "profiles_username_key" ON "public"."profiles" USING "btree" ("lower"("username"));


--
-- Name: projects_client_idempotency_key_uidx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "projects_client_idempotency_key_uidx" ON "public"."projects" USING "btree" ("client_id", "idempotency_key") WHERE ("idempotency_key" IS NOT NULL);


--
-- Name: projects_project_id_uidx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "projects_project_id_uidx" ON "public"."projects" USING "btree" ("project_id");


--
-- Name: publishing_analytics_project_period_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "publishing_analytics_project_period_idx" ON "public"."publishing_analytics" USING "btree" ("project_id", "period_end" DESC);


--
-- Name: publishing_delivery_project_created_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "publishing_delivery_project_created_idx" ON "public"."publishing_delivery_logs" USING "btree" ("project_id", "created_at" DESC);


--
-- Name: publishing_delivery_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "publishing_delivery_status_idx" ON "public"."publishing_delivery_logs" USING "btree" ("status", "updated_at" DESC);


--
-- Name: uq_assignments_project_role_single_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "uq_assignments_project_role_single_active" ON "public"."assignments" USING "btree" ("project_id", "role") WHERE ("active" = true);


--
-- Name: profiles apply_terms_consent_to_profile_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER "apply_terms_consent_to_profile_trigger" BEFORE INSERT ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."apply_terms_consent_to_profile"();


--
-- Name: meetings set_meeting_created_by_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER "set_meeting_created_by_trigger" BEFORE INSERT ON "public"."meetings" FOR EACH ROW EXECUTE FUNCTION "public"."set_meeting_created_by"();


--
-- Name: bundles set_updated_at_bundles; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER "set_updated_at_bundles" BEFORE UPDATE ON "public"."bundles" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_timestamp"();


--
-- Name: invoice_items set_updated_at_invoice_items; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER "set_updated_at_invoice_items" BEFORE UPDATE ON "public"."invoice_items" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_timestamp"();


--
-- Name: services set_updated_at_services; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER "set_updated_at_services" BEFORE UPDATE ON "public"."services" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_timestamp"();


--
-- Name: discussion_messages trg_discussion_messages_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER "trg_discussion_messages_updated_at" BEFORE UPDATE ON "public"."discussion_messages" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();


--
-- Name: drafts trg_drafts_touch; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER "trg_drafts_touch" BEFORE UPDATE ON "public"."drafts" FOR EACH ROW EXECUTE FUNCTION "public"."drafts_touch_updated_at"();


--
-- Name: drafts trg_drafts_version; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER "trg_drafts_version" BEFORE INSERT ON "public"."drafts" FOR EACH ROW EXECUTE FUNCTION "public"."drafts_set_version"();


--
-- Name: invoice_items trg_invoice_total_del; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER "trg_invoice_total_del" AFTER DELETE ON "public"."invoice_items" FOR EACH ROW EXECUTE FUNCTION "public"."recalc_invoice_total"();


--
-- Name: invoice_items trg_invoice_total_ins; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER "trg_invoice_total_ins" AFTER INSERT ON "public"."invoice_items" FOR EACH ROW EXECUTE FUNCTION "public"."recalc_invoice_total"();


--
-- Name: invoice_items trg_invoice_total_upd; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER "trg_invoice_total_upd" AFTER UPDATE ON "public"."invoice_items" FOR EACH ROW EXECUTE FUNCTION "public"."recalc_invoice_total"();


--
-- Name: meetings trg_meetings_set_client_id; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER "trg_meetings_set_client_id" BEFORE INSERT OR UPDATE OF "project_id" ON "public"."meetings" FOR EACH ROW EXECUTE FUNCTION "public"."set_meetings_client_id_from_project"();


--
-- Name: projects trg_projects_propagate_client_id_to_meetings; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER "trg_projects_propagate_client_id_to_meetings" AFTER UPDATE OF "client_id" ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."propagate_project_client_id_to_meetings"();


--
-- Name: reference_links trg_ref_links_set_created_by; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER "trg_ref_links_set_created_by" BEFORE INSERT ON "public"."reference_links" FOR EACH ROW EXECUTE FUNCTION "public"."set_ref_link_created_by"();


--
-- Name: projects trg_set_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER "trg_set_updated_at" BEFORE UPDATE ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();


--
-- Name: assignments trg_validate_assignment_staff_role; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER "trg_validate_assignment_staff_role" BEFORE INSERT OR UPDATE ON "public"."assignments" FOR EACH ROW EXECUTE FUNCTION "public"."validate_assignment_matches_staff_role"();


--
-- Name: assignments assignments_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."assignments"
    ADD CONSTRAINT "assignments_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;


--
-- Name: assignments assignments_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."assignments"
    ADD CONSTRAINT "assignments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("project_id") ON DELETE CASCADE;


--
-- Name: assignments assignments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."assignments"
    ADD CONSTRAINT "assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;


--
-- Name: bundle_items bundle_items_bundle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."bundle_items"
    ADD CONSTRAINT "bundle_items_bundle_id_fkey" FOREIGN KEY ("bundle_id") REFERENCES "public"."bundles"("id") ON DELETE CASCADE;


--
-- Name: bundle_items bundle_items_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."bundle_items"
    ADD CONSTRAINT "bundle_items_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE RESTRICT;


--
-- Name: data_privacy_requests data_privacy_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."data_privacy_requests"
    ADD CONSTRAINT "data_privacy_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: discussion_messages discussion_messages_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."discussion_messages"
    ADD CONSTRAINT "discussion_messages_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: discussion_messages discussion_messages_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."discussion_messages"
    ADD CONSTRAINT "discussion_messages_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "auth"."users"("id");


--
-- Name: discussion_messages discussion_messages_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."discussion_messages"
    ADD CONSTRAINT "discussion_messages_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("project_id") ON DELETE CASCADE;


--
-- Name: distributions distributions_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."distributions"
    ADD CONSTRAINT "distributions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("project_id") ON DELETE CASCADE;


--
-- Name: distributions distributions_publisher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."distributions"
    ADD CONSTRAINT "distributions_publisher_id_fkey" FOREIGN KEY ("publisher_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;


--
-- Name: drafts drafts_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."drafts"
    ADD CONSTRAINT "drafts_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("project_id") ON DELETE CASCADE;


--
-- Name: drafts drafts_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."drafts"
    ADD CONSTRAINT "drafts_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;


--
-- Name: feedbacks feedbacks_draft_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."feedbacks"
    ADD CONSTRAINT "feedbacks_draft_id_fkey" FOREIGN KEY ("draft_id") REFERENCES "public"."drafts"("draft_id") ON DELETE CASCADE;


--
-- Name: feedbacks feedbacks_given_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."feedbacks"
    ADD CONSTRAINT "feedbacks_given_by_fkey" FOREIGN KEY ("given_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;


--
-- Name: feedbacks feedbacks_to_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."feedbacks"
    ADD CONSTRAINT "feedbacks_to_user_id_fkey" FOREIGN KEY ("to_user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;


--
-- Name: invoice_delivery_logs invoice_delivery_logs_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."invoice_delivery_logs"
    ADD CONSTRAINT "invoice_delivery_logs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;


--
-- Name: invoice_delivery_logs invoice_delivery_logs_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."invoice_delivery_logs"
    ADD CONSTRAINT "invoice_delivery_logs_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE CASCADE;


--
-- Name: invoice_items invoice_items_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."invoice_items"
    ADD CONSTRAINT "invoice_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE CASCADE;


--
-- Name: invoice_items invoice_items_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."invoice_items"
    ADD CONSTRAINT "invoice_items_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE SET NULL;


--
-- Name: invoices invoices_client_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_client_fk" FOREIGN KEY ("client_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;


--
-- Name: invoices invoices_project_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_project_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("project_id") ON DELETE SET NULL;


--
-- Name: meetings meetings_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."meetings"
    ADD CONSTRAINT "meetings_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;


--
-- Name: meetings meetings_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."meetings"
    ADD CONSTRAINT "meetings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");


--
-- Name: meetings meetings_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."meetings"
    ADD CONSTRAINT "meetings_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("project_id") ON DELETE CASCADE;


--
-- Name: payment_schedules payment_schedules_milestone_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."payment_schedules"
    ADD CONSTRAINT "payment_schedules_milestone_id_fkey" FOREIGN KEY ("milestone_id") REFERENCES "public"."project_milestones"("id") ON DELETE SET NULL;


--
-- Name: payment_schedules payment_schedules_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."payment_schedules"
    ADD CONSTRAINT "payment_schedules_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("project_id") ON DELETE CASCADE;


--
-- Name: payment_transactions payment_transactions_schedule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."payment_transactions"
    ADD CONSTRAINT "payment_transactions_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "public"."payment_schedules"("id") ON DELETE CASCADE;


--
-- Name: payments payments_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("project_id") ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: project_milestones project_milestones_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."project_milestones"
    ADD CONSTRAINT "project_milestones_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("project_id") ON DELETE CASCADE;


--
-- Name: project_order_items project_order_items_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."project_order_items"
    ADD CONSTRAINT "project_order_items_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("project_id") ON DELETE CASCADE;


--
-- Name: project_order_items project_order_items_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."project_order_items"
    ADD CONSTRAINT "project_order_items_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE SET NULL;


--
-- Name: project_services project_services_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."project_services"
    ADD CONSTRAINT "project_services_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("project_id") ON DELETE CASCADE;


--
-- Name: projects projects_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: projects projects_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE SET NULL;


--
-- Name: publishing_analytics publishing_analytics_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."publishing_analytics"
    ADD CONSTRAINT "publishing_analytics_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;


--
-- Name: publishing_analytics publishing_analytics_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."publishing_analytics"
    ADD CONSTRAINT "publishing_analytics_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("project_id") ON DELETE CASCADE;


--
-- Name: publishing_delivery_logs publishing_delivery_logs_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."publishing_delivery_logs"
    ADD CONSTRAINT "publishing_delivery_logs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;


--
-- Name: publishing_delivery_logs publishing_delivery_logs_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."publishing_delivery_logs"
    ADD CONSTRAINT "publishing_delivery_logs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("project_id") ON DELETE CASCADE;


--
-- Name: reference_links reference_links_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."reference_links"
    ADD CONSTRAINT "reference_links_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;


--
-- Name: reference_links reference_links_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."reference_links"
    ADD CONSTRAINT "reference_links_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("project_id") ON DELETE CASCADE;


--
-- Name: revisions revisions_draft_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."revisions"
    ADD CONSTRAINT "revisions_draft_id_fkey" FOREIGN KEY ("draft_id") REFERENCES "public"."drafts"("draft_id") ON DELETE CASCADE;


--
-- Name: revisions revisions_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."revisions"
    ADD CONSTRAINT "revisions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("project_id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: revisions revisions_requested_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."revisions"
    ADD CONSTRAINT "revisions_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;


--
-- Name: invoice_delivery_logs Admins can read invoice delivery logs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can read invoice delivery logs" ON "public"."invoice_delivery_logs" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "pr"
  WHERE (("pr"."id" = "auth"."uid"()) AND ("pr"."main_role" = ANY (ARRAY['admin'::"public"."global_role", 'owner'::"public"."global_role"]))))));


--
-- Name: publishing_analytics Project participants can read publishing analytics; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Project participants can read publishing analytics" ON "public"."publishing_analytics" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."project_id" = "publishing_analytics"."project_id") AND (("p"."client_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."profiles" "pr"
          WHERE (("pr"."id" = "auth"."uid"()) AND ("pr"."main_role" = ANY (ARRAY['admin'::"public"."global_role", 'owner'::"public"."global_role"]))))))))));


--
-- Name: publishing_delivery_logs Project participants can read publishing delivery logs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Project participants can read publishing delivery logs" ON "public"."publishing_delivery_logs" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."project_id" = "publishing_delivery_logs"."project_id") AND (("p"."client_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."profiles" "pr"
          WHERE (("pr"."id" = "auth"."uid"()) AND ("pr"."main_role" = ANY (ARRAY['admin'::"public"."global_role", 'owner'::"public"."global_role"]))))))))));


--
-- Name: bundle_items admin all on bundle_items; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "admin all on bundle_items" ON "public"."bundle_items" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());


--
-- Name: bundles admin all on bundles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "admin all on bundles" ON "public"."bundles" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());


--
-- Name: services admin all on services; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "admin all on services" ON "public"."services" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());


--
-- Name: meetings admin_owner_can_read_meetings; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "admin_owner_can_read_meetings" ON "public"."meetings" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."main_role" = ANY (ARRAY['admin'::"public"."global_role", 'owner'::"public"."global_role"]))))));


--
-- Name: app_error_events; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."app_error_events" ENABLE ROW LEVEL SECURITY;

--
-- Name: assignments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."assignments" ENABLE ROW LEVEL SECURITY;

--
-- Name: assignments assignments admin write; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "assignments admin write" ON "public"."assignments" USING ("public"."is_admin"("auth"."uid"())) WITH CHECK ("public"."is_admin"("auth"."uid"()));


--
-- Name: assignments assignments read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "assignments read" ON "public"."assignments" FOR SELECT USING ("public"."is_admin"());


--
-- Name: assignments assignments_select_self; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "assignments_select_self" ON "public"."assignments" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));


--
-- Name: bundle_items; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."bundle_items" ENABLE ROW LEVEL SECURITY;

--
-- Name: bundle_items bundle_items_read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "bundle_items_read" ON "public"."bundle_items" FOR SELECT USING (true);


--
-- Name: bundle_items bundle_items_write_admin_owner; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "bundle_items_write_admin_owner" ON "public"."bundle_items" USING ("public"."is_admin_or_owner"()) WITH CHECK ("public"."is_admin_or_owner"());


--
-- Name: bundles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."bundles" ENABLE ROW LEVEL SECURITY;

--
-- Name: bundles bundles_read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "bundles_read" ON "public"."bundles" FOR SELECT USING (true);


--
-- Name: bundles bundles_write_admin_owner; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "bundles_write_admin_owner" ON "public"."bundles" USING ("public"."is_admin_or_owner"()) WITH CHECK ("public"."is_admin_or_owner"());


--
-- Name: meetings client_can_read_own_meetings; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "client_can_read_own_meetings" ON "public"."meetings" FOR SELECT USING (("client_id" = "auth"."uid"()));


--
-- Name: contact_inquiries; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."contact_inquiries" ENABLE ROW LEVEL SECURITY;

--
-- Name: data_privacy_requests; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."data_privacy_requests" ENABLE ROW LEVEL SECURITY;

--
-- Name: data_retention_rules; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."data_retention_rules" ENABLE ROW LEVEL SECURITY;

--
-- Name: discussion_messages; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."discussion_messages" ENABLE ROW LEVEL SECURITY;

--
-- Name: distributions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."distributions" ENABLE ROW LEVEL SECURITY;

--
-- Name: distributions distributions read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "distributions read" ON "public"."distributions" FOR SELECT USING (("public"."is_admin"("auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."project_id" = "distributions"."project_id") AND ("p"."client_id" = "auth"."uid"())))) OR ("publisher_id" = "auth"."uid"())));


--
-- Name: distributions distributions write; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "distributions write" ON "public"."distributions" USING (("public"."is_admin"("auth"."uid"()) OR ("publisher_id" = "auth"."uid"()))) WITH CHECK (("public"."is_admin"("auth"."uid"()) OR ("publisher_id" = "auth"."uid"())));


--
-- Name: discussion_messages dm_delete_by_author_or_admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "dm_delete_by_author_or_admin" ON "public"."discussion_messages" FOR DELETE TO "authenticated" USING ((("author_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "pr"
  WHERE (("pr"."id" = "auth"."uid"()) AND ("pr"."main_role" = ANY (ARRAY['admin'::"public"."global_role", 'owner'::"public"."global_role"])))))));


--
-- Name: discussion_messages dm_insert_by_members; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "dm_insert_by_members" ON "public"."discussion_messages" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."project_id" = "discussion_messages"."project_id") AND (("p"."client_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."assignments" "a"
          WHERE (("a"."project_id" = "p"."project_id") AND ("a"."user_id" = "auth"."uid"()) AND "a"."active"))))))));


--
-- Name: discussion_messages dm_select_visible_to_members; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "dm_select_visible_to_members" ON "public"."discussion_messages" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."project_id" = "discussion_messages"."project_id") AND (("p"."client_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."assignments" "a"
          WHERE (("a"."project_id" = "p"."project_id") AND ("a"."user_id" = "auth"."uid"()) AND "a"."active"))))))));


--
-- Name: discussion_messages dm_update_by_author_or_admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "dm_update_by_author_or_admin" ON "public"."discussion_messages" FOR UPDATE TO "authenticated" USING ((("author_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "pr"
  WHERE (("pr"."id" = "auth"."uid"()) AND ("pr"."main_role" = ANY (ARRAY['admin'::"public"."global_role", 'owner'::"public"."global_role"])))))));


--
-- Name: drafts; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."drafts" ENABLE ROW LEVEL SECURITY;

--
-- Name: drafts drafts_delete_allowed; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "drafts_delete_allowed" ON "public"."drafts" FOR DELETE TO "authenticated" USING ((("uploaded_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."assignments" "pm"
  WHERE (("pm"."project_id" = "drafts"."project_id") AND ("pm"."user_id" = "auth"."uid"()) AND ("pm"."role" = ANY (ARRAY['producer'::"public"."staff_role", 'engineer'::"public"."staff_role", 'composer'::"public"."staff_role"])))))));


--
-- Name: drafts drafts_insert_allowed; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "drafts_insert_allowed" ON "public"."drafts" FOR INSERT TO "authenticated" WITH CHECK ((("uploaded_by" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."assignments" "pm"
  WHERE (("pm"."project_id" = "drafts"."project_id") AND ("pm"."user_id" = "auth"."uid"()) AND ("pm"."role" = ANY (ARRAY['producer'::"public"."staff_role", 'engineer'::"public"."staff_role", 'composer'::"public"."staff_role"])))))));


--
-- Name: drafts drafts_update_allowed; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "drafts_update_allowed" ON "public"."drafts" FOR UPDATE TO "authenticated" USING ((("uploaded_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."assignments" "pm"
  WHERE (("pm"."project_id" = "drafts"."project_id") AND ("pm"."user_id" = "auth"."uid"()) AND ("pm"."role" = ANY (ARRAY['producer'::"public"."staff_role", 'engineer'::"public"."staff_role", 'composer'::"public"."staff_role"]))))))) WITH CHECK ((("uploaded_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."assignments" "pm"
  WHERE (("pm"."project_id" = "drafts"."project_id") AND ("pm"."user_id" = "auth"."uid"()) AND ("pm"."role" = ANY (ARRAY['producer'::"public"."staff_role", 'engineer'::"public"."staff_role", 'composer'::"public"."staff_role"])))))));


--
-- Name: feedbacks; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."feedbacks" ENABLE ROW LEVEL SECURITY;

--
-- Name: feedbacks feedbacks read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "feedbacks read" ON "public"."feedbacks" FOR SELECT USING ((("to_user_id" = "auth"."uid"()) OR ("given_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM ("public"."drafts" "d"
     JOIN "public"."assignments" "a" ON (("a"."project_id" = "d"."project_id")))
  WHERE (("d"."draft_id" = "feedbacks"."draft_id") AND ("a"."active" = true) AND ("a"."user_id" = "auth"."uid"()))))));


--
-- Name: feedbacks feedbacks write; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "feedbacks write" ON "public"."feedbacks" USING (("public"."is_admin"("auth"."uid"()) OR ("given_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM ("public"."drafts" "d"
     JOIN "public"."projects" "p" ON (("p"."project_id" = "d"."project_id")))
  WHERE (("d"."draft_id" = "feedbacks"."draft_id") AND ("p"."client_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM ("public"."drafts" "d"
     JOIN "public"."assignments" "a" ON (("a"."project_id" = "d"."project_id")))
  WHERE (("d"."draft_id" = "feedbacks"."draft_id") AND ("a"."active" = true) AND ("a"."user_id" = "auth"."uid"())))))) WITH CHECK ((("given_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM ("public"."drafts" "d"
     JOIN "public"."assignments" "a" ON (("a"."project_id" = "d"."project_id")))
  WHERE (("d"."draft_id" = "feedbacks"."draft_id") AND ("a"."active" = true) AND ("a"."user_id" = "auth"."uid"()) AND ("a"."role" = ANY (ARRAY['anr'::"public"."staff_role", 'engineer'::"public"."staff_role", 'producer'::"public"."staff_role", 'composer'::"public"."staff_role"])))))));


--
-- Name: profiles insert own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "insert own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));


--
-- Name: revisions insert_revisions_client_or_anr; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "insert_revisions_client_or_anr" ON "public"."revisions" FOR INSERT TO "authenticated" WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."project_id" = "revisions"."project_id") AND ("p"."client_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."assignments" "a"
  WHERE (("a"."active" = true) AND ("a"."user_id" = "auth"."uid"()) AND ("a"."role" = 'anr'::"public"."staff_role") AND ("a"."project_id" = "revisions"."project_id"))))));


--
-- Name: invoice_delivery_logs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."invoice_delivery_logs" ENABLE ROW LEVEL SECURITY;

--
-- Name: invoice_items; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."invoice_items" ENABLE ROW LEVEL SECURITY;

--
-- Name: invoice_items invoice_items_delete_admin_or_project_staff; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "invoice_items_delete_admin_or_project_staff" ON "public"."invoice_items" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."invoices" "i"
  WHERE (("i"."id" = "invoice_items"."invoice_id") AND ("public"."is_admin"("auth"."uid"()) OR "public"."is_assigned_to_project"("auth"."uid"(), "i"."project_id"))))));


--
-- Name: invoice_items invoice_items_insert_admin_or_project_staff; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "invoice_items_insert_admin_or_project_staff" ON "public"."invoice_items" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."invoices" "i"
  WHERE (("i"."id" = "invoice_items"."invoice_id") AND ("public"."is_admin"("auth"."uid"()) OR "public"."is_assigned_to_project"("auth"."uid"(), "i"."project_id"))))));


--
-- Name: invoice_items invoice_items_select_visibility; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "invoice_items_select_visibility" ON "public"."invoice_items" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."invoices" "i"
  WHERE (("i"."id" = "invoice_items"."invoice_id") AND ("public"."is_admin"("auth"."uid"()) OR (("i"."project_id" IS NOT NULL) AND (EXISTS ( SELECT 1
           FROM "public"."projects" "p"
          WHERE (("p"."project_id" = "i"."project_id") AND (("p"."client_id" = "auth"."uid"()) OR "public"."is_assigned_to_project"("auth"."uid"(), "p"."project_id")))))))))));


--
-- Name: invoice_items invoice_items_update_admin_or_project_staff; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "invoice_items_update_admin_or_project_staff" ON "public"."invoice_items" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."invoices" "i"
  WHERE (("i"."id" = "invoice_items"."invoice_id") AND ("public"."is_admin"("auth"."uid"()) OR "public"."is_assigned_to_project"("auth"."uid"(), "i"."project_id")))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."invoices" "i"
  WHERE (("i"."id" = "invoice_items"."invoice_id") AND ("public"."is_admin"("auth"."uid"()) OR "public"."is_assigned_to_project"("auth"."uid"(), "i"."project_id"))))));


--
-- Name: invoices; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."invoices" ENABLE ROW LEVEL SECURITY;

--
-- Name: invoices invoices_delete_admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "invoices_delete_admin" ON "public"."invoices" FOR DELETE TO "authenticated" USING ("public"."is_admin"("auth"."uid"()));


--
-- Name: invoices invoices_insert_admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "invoices_insert_admin" ON "public"."invoices" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin"("auth"."uid"()));


--
-- Name: invoices invoices_insert_admin_owner; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "invoices_insert_admin_owner" ON "public"."invoices" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin"("auth"."uid"()));


--
-- Name: invoices invoices_select_admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "invoices_select_admin" ON "public"."invoices" FOR SELECT USING ("public"."is_admin"());


--
-- Name: invoices invoices_select_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "invoices_select_own" ON "public"."invoices" FOR SELECT USING (("auth"."uid"() = "client_id"));


--
-- Name: invoices invoices_select_visibility; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "invoices_select_visibility" ON "public"."invoices" FOR SELECT TO "authenticated" USING (("public"."is_admin"("auth"."uid"()) OR ("client_id" = "auth"."uid"())));


--
-- Name: invoices invoices_update_admin_owner; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "invoices_update_admin_owner" ON "public"."invoices" FOR UPDATE TO "authenticated" USING ("public"."is_admin"("auth"."uid"())) WITH CHECK ("public"."is_admin"("auth"."uid"()));


--
-- Name: meetings; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."meetings" ENABLE ROW LEVEL SECURITY;

--
-- Name: meetings meetings_participant_delete; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "meetings_participant_delete" ON "public"."meetings" FOR DELETE TO "authenticated" USING ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."main_role" = ANY (ARRAY['admin'::"public"."global_role", 'owner'::"public"."global_role"])))))));


--
-- Name: meetings meetings_participant_insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "meetings_participant_insert" ON "public"."meetings" FOR INSERT TO "authenticated" WITH CHECK ((("created_by" = "auth"."uid"()) AND (("client_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."main_role" = ANY (ARRAY['admin'::"public"."global_role", 'owner'::"public"."global_role"]))))) OR (EXISTS ( SELECT 1
   FROM "public"."assignments" "a"
  WHERE (("a"."project_id" = "meetings"."project_id") AND ("a"."user_id" = "auth"."uid"()) AND "a"."active"))))));


--
-- Name: meetings meetings_participant_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "meetings_participant_select" ON "public"."meetings" FOR SELECT TO "authenticated" USING ((("client_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."main_role" = ANY (ARRAY['admin'::"public"."global_role", 'owner'::"public"."global_role"]))))) OR (EXISTS ( SELECT 1
   FROM "public"."assignments" "a"
  WHERE (("a"."project_id" = "meetings"."project_id") AND ("a"."user_id" = "auth"."uid"()) AND "a"."active")))));


--
-- Name: meetings meetings_participant_update; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "meetings_participant_update" ON "public"."meetings" FOR UPDATE TO "authenticated" USING ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."main_role" = ANY (ARRAY['admin'::"public"."global_role", 'owner'::"public"."global_role"]))))))) WITH CHECK ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."main_role" = ANY (ARRAY['admin'::"public"."global_role", 'owner'::"public"."global_role"])))))));


--
-- Name: profiles owner can update profiles role; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "owner can update profiles role" ON "public"."profiles" FOR UPDATE USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());


--
-- Name: payment_schedules; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."payment_schedules" ENABLE ROW LEVEL SECURITY;

--
-- Name: payment_transactions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."payment_transactions" ENABLE ROW LEVEL SECURITY;

--
-- Name: payments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;

--
-- Name: payments payments read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "payments read" ON "public"."payments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."project_id" = "payments"."project_id") AND (("p"."client_id" = "auth"."uid"()) OR "public"."is_admin"("auth"."uid"()))))));


--
-- Name: payments payments write; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "payments write" ON "public"."payments" USING ((EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."project_id" = "payments"."project_id") AND (("p"."client_id" = "auth"."uid"()) OR "public"."is_admin"("auth"."uid"())))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."project_id" = "payments"."project_id") AND (("p"."client_id" = "auth"."uid"()) OR "public"."is_admin"("auth"."uid"()))))));


--
-- Name: payments payments_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "payments_select" ON "public"."payments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."projects" "pr"
  WHERE (("pr"."project_id" = "payments"."project_id") AND (("pr"."client_id" = "auth"."uid"()) OR "public"."is_admin"("auth"."uid"()))))));


--
-- Name: data_privacy_requests privacy requests own insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "privacy requests own insert" ON "public"."data_privacy_requests" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() = "user_id") AND ("status" = 'pending'::"text")));


--
-- Name: data_privacy_requests privacy requests own read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "privacy requests own read" ON "public"."data_privacy_requests" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));


--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles profiles owner read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "profiles owner read" ON "public"."profiles" FOR SELECT USING ((("auth"."uid"() = "id") OR "public"."is_admin"("auth"."uid"())));


--
-- Name: profiles profiles owner upsert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "profiles owner upsert" ON "public"."profiles" USING ((("auth"."uid"() = "id") OR "public"."is_admin"("auth"."uid"()))) WITH CHECK ((("auth"."uid"() = "id") OR "public"."is_admin"("auth"."uid"())));


--
-- Name: profiles profiles: read self; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "profiles: read self" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("id" = "auth"."uid"()));


--
-- Name: profiles profiles_insert_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "profiles_insert_own" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "id"));


--
-- Name: profiles profiles_read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "profiles_read" ON "public"."profiles" FOR SELECT USING ((("auth"."uid"() = "id") OR "public"."is_admin_or_owner"()));


--
-- Name: profiles profiles_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "profiles_select" ON "public"."profiles" FOR SELECT USING (("public"."is_admin"("auth"."uid"()) OR ("id" = "auth"."uid"())));


--
-- Name: profiles profiles_select_for_admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "profiles_select_for_admin" ON "public"."profiles" FOR SELECT TO "authenticated" USING ("public"."is_admin"("auth"."uid"()));


--
-- Name: profiles profiles_select_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "profiles_select_own" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "id"));


--
-- Name: profiles profiles_update; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "profiles_update" ON "public"."profiles" FOR UPDATE USING (("public"."is_admin"("auth"."uid"()) OR ("id" = "auth"."uid"()))) WITH CHECK (("public"."is_admin"("auth"."uid"()) OR ("id" = "auth"."uid"())));


--
-- Name: project_milestones; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."project_milestones" ENABLE ROW LEVEL SECURITY;

--
-- Name: project_milestones project_milestones_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "project_milestones_select" ON "public"."project_milestones" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."projects" "pr"
  WHERE (("pr"."project_id" = "project_milestones"."project_id") AND (("pr"."client_id" = "auth"."uid"()) OR "public"."is_admin"("auth"."uid"()))))));


--
-- Name: project_order_items; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."project_order_items" ENABLE ROW LEVEL SECURITY;

--
-- Name: project_order_items project_order_items_select_participant; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "project_order_items_select_participant" ON "public"."project_order_items" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."project_id" = "project_order_items"."project_id") AND (("p"."client_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."profiles" "pr"
          WHERE (("pr"."id" = "auth"."uid"()) AND ("pr"."main_role" = ANY (ARRAY['admin'::"public"."global_role", 'owner'::"public"."global_role"]))))))))));


--
-- Name: project_services; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."project_services" ENABLE ROW LEVEL SECURITY;

--
-- Name: project_services project_services_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "project_services_select" ON "public"."project_services" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."projects" "pr"
  WHERE (("pr"."project_id" = "project_services"."project_id") AND (("pr"."client_id" = "auth"."uid"()) OR "public"."is_admin"("auth"."uid"()))))));


--
-- Name: projects; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;

--
-- Name: projects projects read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "projects read" ON "public"."projects" FOR SELECT TO "authenticated" USING ((("client_id" = "auth"."uid"()) OR (("auth"."jwt"() ->> 'role'::"text") = ANY (ARRAY['owner'::"text", 'admin'::"text"]))));


--
-- Name: projects projects: select owner or admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "projects: select owner or admin" ON "public"."projects" FOR SELECT TO "authenticated" USING ((("client_id" = "auth"."uid"()) OR ((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text") = 'admin'::"text")));


--
-- Name: projects projects_admin_update; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "projects_admin_update" ON "public"."projects" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."main_role" = ANY (ARRAY['admin'::"public"."global_role", 'owner'::"public"."global_role"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."main_role" = ANY (ARRAY['admin'::"public"."global_role", 'owner'::"public"."global_role"]))))));


--
-- Name: projects projects_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "projects_select" ON "public"."projects" FOR SELECT TO "authenticated" USING ((("client_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."main_role" = ANY (ARRAY['owner'::"public"."global_role", 'admin'::"public"."global_role"])))))));


--
-- Name: publishing_analytics; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."publishing_analytics" ENABLE ROW LEVEL SECURITY;

--
-- Name: publishing_delivery_logs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."publishing_delivery_logs" ENABLE ROW LEVEL SECURITY;

--
-- Name: bundles read active bundles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "read active bundles" ON "public"."bundles" FOR SELECT TO "authenticated", "anon" USING (("is_active" = true));


--
-- Name: services read active services; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "read active services" ON "public"."services" FOR SELECT TO "authenticated", "anon" USING (("is_active" = true));


--
-- Name: bundle_items read bundle_items via active parents; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "read bundle_items via active parents" ON "public"."bundle_items" FOR SELECT TO "authenticated", "anon" USING (((EXISTS ( SELECT 1
   FROM "public"."bundles" "b"
  WHERE (("b"."id" = "bundle_items"."bundle_id") AND ("b"."is_active" = true)))) AND (EXISTS ( SELECT 1
   FROM "public"."services" "s"
  WHERE (("s"."id" = "bundle_items"."service_id") AND ("s"."is_active" = true))))));


--
-- Name: profiles read own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "read own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));


--
-- Name: reference_links ref_links_delete; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "ref_links_delete" ON "public"."reference_links" FOR DELETE TO "authenticated" USING ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "pr"
  WHERE (("pr"."id" = "auth"."uid"()) AND (('owner'::"text" = ANY (("pr"."staff_role")::"text"[])) OR ('admin'::"text" = ANY (("pr"."staff_role")::"text"[])))))) OR (EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."project_id" = "reference_links"."project_id") AND (("p"."client_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."assignments" "a"
          WHERE (("a"."project_id" = "reference_links"."project_id") AND ("a"."user_id" = "auth"."uid"()) AND "a"."active")))))))));


--
-- Name: reference_links ref_links_insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "ref_links_insert" ON "public"."reference_links" FOR INSERT TO "authenticated" WITH CHECK ((("created_by" = "auth"."uid"()) AND ((EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."project_id" = "reference_links"."project_id") AND (("p"."client_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."assignments" "a"
          WHERE (("a"."project_id" = "reference_links"."project_id") AND ("a"."user_id" = "auth"."uid"()) AND "a"."active"))))))) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "pr"
  WHERE (("pr"."id" = "auth"."uid"()) AND (('owner'::"text" = ANY (("pr"."staff_role")::"text"[])) OR ('admin'::"text" = ANY (("pr"."staff_role")::"text"[])))))))));


--
-- Name: reference_links ref_links_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "ref_links_select" ON "public"."reference_links" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."project_id" = "reference_links"."project_id") AND (("p"."client_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."assignments" "a"
          WHERE (("a"."project_id" = "reference_links"."project_id") AND ("a"."user_id" = "auth"."uid"()) AND "a"."active"))))))) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "pr"
  WHERE (("pr"."id" = "auth"."uid"()) AND (('owner'::"text" = ANY (("pr"."staff_role")::"text"[])) OR ('admin'::"text" = ANY (("pr"."staff_role")::"text"[]))))))));


--
-- Name: reference_links ref_links_update; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "ref_links_update" ON "public"."reference_links" FOR UPDATE TO "authenticated" USING ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "pr"
  WHERE (("pr"."id" = "auth"."uid"()) AND (('owner'::"text" = ANY (("pr"."staff_role")::"text"[])) OR ('admin'::"text" = ANY (("pr"."staff_role")::"text"[])))))) OR (EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."project_id" = "reference_links"."project_id") AND (("p"."client_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."assignments" "a"
          WHERE (("a"."project_id" = "reference_links"."project_id") AND ("a"."user_id" = "auth"."uid"()) AND "a"."active"))))))))) WITH CHECK ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "pr"
  WHERE (("pr"."id" = "auth"."uid"()) AND (('owner'::"text" = ANY (("pr"."staff_role")::"text"[])) OR ('admin'::"text" = ANY (("pr"."staff_role")::"text"[])))))) OR (EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."project_id" = "reference_links"."project_id") AND (("p"."client_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."assignments" "a"
          WHERE (("a"."project_id" = "reference_links"."project_id") AND ("a"."user_id" = "auth"."uid"()) AND "a"."active")))))))));


--
-- Name: reference_links; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."reference_links" ENABLE ROW LEVEL SECURITY;

--
-- Name: revisions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."revisions" ENABLE ROW LEVEL SECURITY;

--
-- Name: revisions revisions read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "revisions read" ON "public"."revisions" FOR SELECT USING ((("requested_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM ("public"."drafts" "d"
     JOIN "public"."assignments" "a" ON (("a"."project_id" = "d"."project_id")))
  WHERE (("d"."draft_id" = "revisions"."draft_id") AND ("a"."active" = true) AND ("a"."user_id" = "auth"."uid"()))))));


--
-- Name: revisions revisions write; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "revisions write" ON "public"."revisions" USING (("public"."is_admin"("auth"."uid"()) OR ("requested_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM ("public"."drafts" "d"
     JOIN "public"."projects" "p" ON (("p"."project_id" = "d"."project_id")))
  WHERE (("d"."draft_id" = "revisions"."draft_id") AND ("p"."client_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM ("public"."drafts" "d"
     JOIN "public"."assignments" "a" ON (("a"."project_id" = "d"."project_id")))
  WHERE (("d"."draft_id" = "revisions"."draft_id") AND ("a"."active" = true) AND ("a"."user_id" = "auth"."uid"())))))) WITH CHECK ((("requested_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM ("public"."drafts" "d"
     JOIN "public"."assignments" "a" ON (("a"."project_id" = "d"."project_id")))
  WHERE (("d"."draft_id" = "revisions"."draft_id") AND ("a"."active" = true) AND ("a"."user_id" = "auth"."uid"()) AND ("a"."role" = ANY (ARRAY['anr'::"public"."staff_role", 'engineer'::"public"."staff_role", 'producer'::"public"."staff_role", 'composer'::"public"."staff_role"])))))));


--
-- Name: roles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."roles" ENABLE ROW LEVEL SECURITY;

--
-- Name: roles roles public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "roles public read" ON "public"."roles" FOR SELECT USING (true);


--
-- Name: project_milestones sel_milestones_owner; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "sel_milestones_owner" ON "public"."project_milestones" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."project_id" = "project_milestones"."project_id") AND ("p"."client_id" = "auth"."uid"())))));


--
-- Name: payment_schedules sel_sched_owner; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "sel_sched_owner" ON "public"."payment_schedules" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."project_id" = "payment_schedules"."project_id") AND ("p"."client_id" = "auth"."uid"())))));


--
-- Name: payment_transactions sel_tx_owner; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "sel_tx_owner" ON "public"."payment_transactions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."payment_schedules" "s"
     JOIN "public"."projects" "p" ON (("p"."project_id" = "s"."project_id")))
  WHERE (("s"."id" = "payment_transactions"."schedule_id") AND ("p"."client_id" = "auth"."uid"())))));


--
-- Name: drafts select_drafts_participants_and_client; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "select_drafts_participants_and_client" ON "public"."drafts" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."assignments" "a"
  WHERE (("a"."active" = true) AND ("a"."user_id" = "auth"."uid"()) AND ("a"."project_id" = "drafts"."project_id")))) OR (EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."project_id" = "drafts"."project_id") AND ("p"."client_id" = "auth"."uid"()))))));


--
-- Name: revisions select_revisions_participants_and_client; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "select_revisions_participants_and_client" ON "public"."revisions" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."assignments" "a"
  WHERE (("a"."active" = true) AND ("a"."user_id" = "auth"."uid"()) AND ("a"."project_id" = "revisions"."project_id")))) OR (EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."project_id" = "revisions"."project_id") AND ("p"."client_id" = "auth"."uid"()))))));


--
-- Name: services; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."services" ENABLE ROW LEVEL SECURITY;

--
-- Name: services services_read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "services_read" ON "public"."services" FOR SELECT USING (true);


--
-- Name: services services_read_active; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "services_read_active" ON "public"."services" FOR SELECT TO "authenticated" USING (("is_active" = true));


--
-- Name: services services_write_admin_only; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "services_write_admin_only" ON "public"."services" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."assignments" "a"
  WHERE (("a"."user_id" = "auth"."uid"()) AND ("a"."role" = ANY (ARRAY['admin'::"public"."staff_role"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."assignments" "a"
  WHERE (("a"."user_id" = "auth"."uid"()) AND ("a"."role" = ANY (ARRAY['admin'::"public"."staff_role"]))))));


--
-- Name: services services_write_admin_owner; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "services_write_admin_owner" ON "public"."services" USING ("public"."is_admin_or_owner"()) WITH CHECK ("public"."is_admin_or_owner"());


--
-- Name: profiles update own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));


--
-- Name: profiles upsert own profile insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "upsert own profile insert" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));


--
-- Name: profiles upsert own profile update; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "upsert own profile update" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));


--
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: postgres
--

CREATE PUBLICATION "supabase_realtime" WITH (publish = 'insert, update, delete, truncate');


ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";

--
-- Name: supabase_realtime_messages_publication; Type: PUBLICATION; Schema: -; Owner: supabase_admin
--

CREATE PUBLICATION "supabase_realtime_messages_publication" WITH (publish = 'insert, update, delete, truncate');


ALTER PUBLICATION "supabase_realtime_messages_publication" OWNER TO "supabase_admin";

--
-- Name: supabase_realtime discussion_messages; Type: PUBLICATION TABLE; Schema: public; Owner: postgres
--

ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."discussion_messages";


--
-- Name: supabase_realtime invoice_items; Type: PUBLICATION TABLE; Schema: public; Owner: postgres
--

ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."invoice_items";


--
-- Name: supabase_realtime invoices; Type: PUBLICATION TABLE; Schema: public; Owner: postgres
--

ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."invoices";


--
-- Name: supabase_realtime meetings; Type: PUBLICATION TABLE; Schema: public; Owner: postgres
--

ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."meetings";


--
-- Name: SCHEMA "net"; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA "net" TO "supabase_functions_admin";
GRANT USAGE ON SCHEMA "net" TO "postgres";
GRANT USAGE ON SCHEMA "net" TO "anon";
GRANT USAGE ON SCHEMA "net" TO "authenticated";
GRANT USAGE ON SCHEMA "net" TO "service_role";


--
-- Name: SCHEMA "public"; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";


--
-- Name: FUNCTION "citextin"("cstring"); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "public"."citextin"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."citextin"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."citextin"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citextin"("cstring") TO "service_role";


--
-- Name: FUNCTION "citextout"("public"."citext"); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "public"."citextout"("public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citextout"("public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citextout"("public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citextout"("public"."citext") TO "service_role";


--
-- Name: FUNCTION "citextrecv"("internal"); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "public"."citextrecv"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."citextrecv"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."citextrecv"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citextrecv"("internal") TO "service_role";


--
-- Name: FUNCTION "citextsend"("public"."citext"); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "public"."citextsend"("public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citextsend"("public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citextsend"("public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citextsend"("public"."citext") TO "service_role";


--
-- Name: FUNCTION "citext"(boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "public"."citext"(boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."citext"(boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."citext"(boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext"(boolean) TO "service_role";


--
-- Name: FUNCTION "citext"(character); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "public"."citext"(character) TO "postgres";
GRANT ALL ON FUNCTION "public"."citext"(character) TO "anon";
GRANT ALL ON FUNCTION "public"."citext"(character) TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext"(character) TO "service_role";


--
-- Name: FUNCTION "citext"("inet"); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "public"."citext"("inet") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext"("inet") TO "anon";
GRANT ALL ON FUNCTION "public"."citext"("inet") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext"("inet") TO "service_role";


--
-- Name: FUNCTION "armor"("bytea"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."armor"("bytea") FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."armor"("bytea") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."armor"("bytea") TO "dashboard_user";


--
-- Name: FUNCTION "armor"("bytea", "text"[], "text"[]); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."armor"("bytea", "text"[], "text"[]) FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."armor"("bytea", "text"[], "text"[]) TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."armor"("bytea", "text"[], "text"[]) TO "dashboard_user";


--
-- Name: FUNCTION "crypt"("text", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."crypt"("text", "text") FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."crypt"("text", "text") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."crypt"("text", "text") TO "dashboard_user";


--
-- Name: FUNCTION "dearmor"("text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."dearmor"("text") FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."dearmor"("text") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."dearmor"("text") TO "dashboard_user";


--
-- Name: FUNCTION "decrypt"("bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."decrypt"("bytea", "bytea", "text") FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."decrypt"("bytea", "bytea", "text") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."decrypt"("bytea", "bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "decrypt_iv"("bytea", "bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."decrypt_iv"("bytea", "bytea", "bytea", "text") FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."decrypt_iv"("bytea", "bytea", "bytea", "text") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."decrypt_iv"("bytea", "bytea", "bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "digest"("bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."digest"("bytea", "text") FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."digest"("bytea", "text") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."digest"("bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "digest"("text", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."digest"("text", "text") FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."digest"("text", "text") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."digest"("text", "text") TO "dashboard_user";


--
-- Name: FUNCTION "encrypt"("bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."encrypt"("bytea", "bytea", "text") FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."encrypt"("bytea", "bytea", "text") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."encrypt"("bytea", "bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "encrypt_iv"("bytea", "bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."encrypt_iv"("bytea", "bytea", "bytea", "text") FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."encrypt_iv"("bytea", "bytea", "bytea", "text") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."encrypt_iv"("bytea", "bytea", "bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "gen_random_bytes"(integer); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."gen_random_bytes"(integer) FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."gen_random_bytes"(integer) TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."gen_random_bytes"(integer) TO "dashboard_user";


--
-- Name: FUNCTION "gen_random_uuid"(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."gen_random_uuid"() FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."gen_random_uuid"() TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."gen_random_uuid"() TO "dashboard_user";


--
-- Name: FUNCTION "gen_salt"("text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."gen_salt"("text") FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."gen_salt"("text") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."gen_salt"("text") TO "dashboard_user";


--
-- Name: FUNCTION "gen_salt"("text", integer); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."gen_salt"("text", integer) FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."gen_salt"("text", integer) TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."gen_salt"("text", integer) TO "dashboard_user";


--
-- Name: FUNCTION "hmac"("bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."hmac"("bytea", "bytea", "text") FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."hmac"("bytea", "bytea", "text") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."hmac"("bytea", "bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "hmac"("text", "text", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."hmac"("text", "text", "text") FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."hmac"("text", "text", "text") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."hmac"("text", "text", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pg_stat_statements"("showtext" boolean, OUT "userid" "oid", OUT "dbid" "oid", OUT "toplevel" boolean, OUT "queryid" bigint, OUT "query" "text", OUT "plans" bigint, OUT "total_plan_time" double precision, OUT "min_plan_time" double precision, OUT "max_plan_time" double precision, OUT "mean_plan_time" double precision, OUT "stddev_plan_time" double precision, OUT "calls" bigint, OUT "total_exec_time" double precision, OUT "min_exec_time" double precision, OUT "max_exec_time" double precision, OUT "mean_exec_time" double precision, OUT "stddev_exec_time" double precision, OUT "rows" bigint, OUT "shared_blks_hit" bigint, OUT "shared_blks_read" bigint, OUT "shared_blks_dirtied" bigint, OUT "shared_blks_written" bigint, OUT "local_blks_hit" bigint, OUT "local_blks_read" bigint, OUT "local_blks_dirtied" bigint, OUT "local_blks_written" bigint, OUT "temp_blks_read" bigint, OUT "temp_blks_written" bigint, OUT "shared_blk_read_time" double precision, OUT "shared_blk_write_time" double precision, OUT "local_blk_read_time" double precision, OUT "local_blk_write_time" double precision, OUT "temp_blk_read_time" double precision, OUT "temp_blk_write_time" double precision, OUT "wal_records" bigint, OUT "wal_fpi" bigint, OUT "wal_bytes" numeric, OUT "jit_functions" bigint, OUT "jit_generation_time" double precision, OUT "jit_inlining_count" bigint, OUT "jit_inlining_time" double precision, OUT "jit_optimization_count" bigint, OUT "jit_optimization_time" double precision, OUT "jit_emission_count" bigint, OUT "jit_emission_time" double precision, OUT "jit_deform_count" bigint, OUT "jit_deform_time" double precision, OUT "stats_since" timestamp with time zone, OUT "minmax_stats_since" timestamp with time zone); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."pg_stat_statements"("showtext" boolean, OUT "userid" "oid", OUT "dbid" "oid", OUT "toplevel" boolean, OUT "queryid" bigint, OUT "query" "text", OUT "plans" bigint, OUT "total_plan_time" double precision, OUT "min_plan_time" double precision, OUT "max_plan_time" double precision, OUT "mean_plan_time" double precision, OUT "stddev_plan_time" double precision, OUT "calls" bigint, OUT "total_exec_time" double precision, OUT "min_exec_time" double precision, OUT "max_exec_time" double precision, OUT "mean_exec_time" double precision, OUT "stddev_exec_time" double precision, OUT "rows" bigint, OUT "shared_blks_hit" bigint, OUT "shared_blks_read" bigint, OUT "shared_blks_dirtied" bigint, OUT "shared_blks_written" bigint, OUT "local_blks_hit" bigint, OUT "local_blks_read" bigint, OUT "local_blks_dirtied" bigint, OUT "local_blks_written" bigint, OUT "temp_blks_read" bigint, OUT "temp_blks_written" bigint, OUT "shared_blk_read_time" double precision, OUT "shared_blk_write_time" double precision, OUT "local_blk_read_time" double precision, OUT "local_blk_write_time" double precision, OUT "temp_blk_read_time" double precision, OUT "temp_blk_write_time" double precision, OUT "wal_records" bigint, OUT "wal_fpi" bigint, OUT "wal_bytes" numeric, OUT "jit_functions" bigint, OUT "jit_generation_time" double precision, OUT "jit_inlining_count" bigint, OUT "jit_inlining_time" double precision, OUT "jit_optimization_count" bigint, OUT "jit_optimization_time" double precision, OUT "jit_emission_count" bigint, OUT "jit_emission_time" double precision, OUT "jit_deform_count" bigint, OUT "jit_deform_time" double precision, OUT "stats_since" timestamp with time zone, OUT "minmax_stats_since" timestamp with time zone) FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."pg_stat_statements"("showtext" boolean, OUT "userid" "oid", OUT "dbid" "oid", OUT "toplevel" boolean, OUT "queryid" bigint, OUT "query" "text", OUT "plans" bigint, OUT "total_plan_time" double precision, OUT "min_plan_time" double precision, OUT "max_plan_time" double precision, OUT "mean_plan_time" double precision, OUT "stddev_plan_time" double precision, OUT "calls" bigint, OUT "total_exec_time" double precision, OUT "min_exec_time" double precision, OUT "max_exec_time" double precision, OUT "mean_exec_time" double precision, OUT "stddev_exec_time" double precision, OUT "rows" bigint, OUT "shared_blks_hit" bigint, OUT "shared_blks_read" bigint, OUT "shared_blks_dirtied" bigint, OUT "shared_blks_written" bigint, OUT "local_blks_hit" bigint, OUT "local_blks_read" bigint, OUT "local_blks_dirtied" bigint, OUT "local_blks_written" bigint, OUT "temp_blks_read" bigint, OUT "temp_blks_written" bigint, OUT "shared_blk_read_time" double precision, OUT "shared_blk_write_time" double precision, OUT "local_blk_read_time" double precision, OUT "local_blk_write_time" double precision, OUT "temp_blk_read_time" double precision, OUT "temp_blk_write_time" double precision, OUT "wal_records" bigint, OUT "wal_fpi" bigint, OUT "wal_bytes" numeric, OUT "jit_functions" bigint, OUT "jit_generation_time" double precision, OUT "jit_inlining_count" bigint, OUT "jit_inlining_time" double precision, OUT "jit_optimization_count" bigint, OUT "jit_optimization_time" double precision, OUT "jit_emission_count" bigint, OUT "jit_emission_time" double precision, OUT "jit_deform_count" bigint, OUT "jit_deform_time" double precision, OUT "stats_since" timestamp with time zone, OUT "minmax_stats_since" timestamp with time zone) TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."pg_stat_statements"("showtext" boolean, OUT "userid" "oid", OUT "dbid" "oid", OUT "toplevel" boolean, OUT "queryid" bigint, OUT "query" "text", OUT "plans" bigint, OUT "total_plan_time" double precision, OUT "min_plan_time" double precision, OUT "max_plan_time" double precision, OUT "mean_plan_time" double precision, OUT "stddev_plan_time" double precision, OUT "calls" bigint, OUT "total_exec_time" double precision, OUT "min_exec_time" double precision, OUT "max_exec_time" double precision, OUT "mean_exec_time" double precision, OUT "stddev_exec_time" double precision, OUT "rows" bigint, OUT "shared_blks_hit" bigint, OUT "shared_blks_read" bigint, OUT "shared_blks_dirtied" bigint, OUT "shared_blks_written" bigint, OUT "local_blks_hit" bigint, OUT "local_blks_read" bigint, OUT "local_blks_dirtied" bigint, OUT "local_blks_written" bigint, OUT "temp_blks_read" bigint, OUT "temp_blks_written" bigint, OUT "shared_blk_read_time" double precision, OUT "shared_blk_write_time" double precision, OUT "local_blk_read_time" double precision, OUT "local_blk_write_time" double precision, OUT "temp_blk_read_time" double precision, OUT "temp_blk_write_time" double precision, OUT "wal_records" bigint, OUT "wal_fpi" bigint, OUT "wal_bytes" numeric, OUT "jit_functions" bigint, OUT "jit_generation_time" double precision, OUT "jit_inlining_count" bigint, OUT "jit_inlining_time" double precision, OUT "jit_optimization_count" bigint, OUT "jit_optimization_time" double precision, OUT "jit_emission_count" bigint, OUT "jit_emission_time" double precision, OUT "jit_deform_count" bigint, OUT "jit_deform_time" double precision, OUT "stats_since" timestamp with time zone, OUT "minmax_stats_since" timestamp with time zone) TO "dashboard_user";


--
-- Name: FUNCTION "pg_stat_statements_info"(OUT "dealloc" bigint, OUT "stats_reset" timestamp with time zone); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."pg_stat_statements_info"(OUT "dealloc" bigint, OUT "stats_reset" timestamp with time zone) FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."pg_stat_statements_info"(OUT "dealloc" bigint, OUT "stats_reset" timestamp with time zone) TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."pg_stat_statements_info"(OUT "dealloc" bigint, OUT "stats_reset" timestamp with time zone) TO "dashboard_user";


--
-- Name: FUNCTION "pg_stat_statements_reset"("userid" "oid", "dbid" "oid", "queryid" bigint, "minmax_only" boolean); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."pg_stat_statements_reset"("userid" "oid", "dbid" "oid", "queryid" bigint, "minmax_only" boolean) FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."pg_stat_statements_reset"("userid" "oid", "dbid" "oid", "queryid" bigint, "minmax_only" boolean) TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."pg_stat_statements_reset"("userid" "oid", "dbid" "oid", "queryid" bigint, "minmax_only" boolean) TO "dashboard_user";


--
-- Name: FUNCTION "pgp_armor_headers"("text", OUT "key" "text", OUT "value" "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."pgp_armor_headers"("text", OUT "key" "text", OUT "value" "text") FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."pgp_armor_headers"("text", OUT "key" "text", OUT "value" "text") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."pgp_armor_headers"("text", OUT "key" "text", OUT "value" "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_key_id"("bytea"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."pgp_key_id"("bytea") FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."pgp_key_id"("bytea") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."pgp_key_id"("bytea") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_pub_decrypt"("bytea", "bytea"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."pgp_pub_decrypt"("bytea", "bytea") FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt"("bytea", "bytea") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt"("bytea", "bytea") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_pub_decrypt"("bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."pgp_pub_decrypt"("bytea", "bytea", "text") FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt"("bytea", "bytea", "text") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt"("bytea", "bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_pub_decrypt"("bytea", "bytea", "text", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."pgp_pub_decrypt"("bytea", "bytea", "text", "text") FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt"("bytea", "bytea", "text", "text") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt"("bytea", "bytea", "text", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_pub_decrypt_bytea"("bytea", "bytea"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."pgp_pub_decrypt_bytea"("bytea", "bytea") FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt_bytea"("bytea", "bytea") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt_bytea"("bytea", "bytea") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_pub_decrypt_bytea"("bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."pgp_pub_decrypt_bytea"("bytea", "bytea", "text") FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt_bytea"("bytea", "bytea", "text") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt_bytea"("bytea", "bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_pub_decrypt_bytea"("bytea", "bytea", "text", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."pgp_pub_decrypt_bytea"("bytea", "bytea", "text", "text") FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt_bytea"("bytea", "bytea", "text", "text") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt_bytea"("bytea", "bytea", "text", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_pub_encrypt"("text", "bytea"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."pgp_pub_encrypt"("text", "bytea") FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."pgp_pub_encrypt"("text", "bytea") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."pgp_pub_encrypt"("text", "bytea") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_pub_encrypt"("text", "bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."pgp_pub_encrypt"("text", "bytea", "text") FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."pgp_pub_encrypt"("text", "bytea", "text") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."pgp_pub_encrypt"("text", "bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_pub_encrypt_bytea"("bytea", "bytea"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."pgp_pub_encrypt_bytea"("bytea", "bytea") FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."pgp_pub_encrypt_bytea"("bytea", "bytea") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."pgp_pub_encrypt_bytea"("bytea", "bytea") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_pub_encrypt_bytea"("bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."pgp_pub_encrypt_bytea"("bytea", "bytea", "text") FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."pgp_pub_encrypt_bytea"("bytea", "bytea", "text") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."pgp_pub_encrypt_bytea"("bytea", "bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_sym_decrypt"("bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."pgp_sym_decrypt"("bytea", "text") FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."pgp_sym_decrypt"("bytea", "text") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."pgp_sym_decrypt"("bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_sym_decrypt"("bytea", "text", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."pgp_sym_decrypt"("bytea", "text", "text") FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."pgp_sym_decrypt"("bytea", "text", "text") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."pgp_sym_decrypt"("bytea", "text", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_sym_decrypt_bytea"("bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."pgp_sym_decrypt_bytea"("bytea", "text") FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."pgp_sym_decrypt_bytea"("bytea", "text") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."pgp_sym_decrypt_bytea"("bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_sym_decrypt_bytea"("bytea", "text", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."pgp_sym_decrypt_bytea"("bytea", "text", "text") FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."pgp_sym_decrypt_bytea"("bytea", "text", "text") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."pgp_sym_decrypt_bytea"("bytea", "text", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_sym_encrypt"("text", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."pgp_sym_encrypt"("text", "text") FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."pgp_sym_encrypt"("text", "text") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."pgp_sym_encrypt"("text", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_sym_encrypt"("text", "text", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."pgp_sym_encrypt"("text", "text", "text") FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."pgp_sym_encrypt"("text", "text", "text") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."pgp_sym_encrypt"("text", "text", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_sym_encrypt_bytea"("bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."pgp_sym_encrypt_bytea"("bytea", "text") FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."pgp_sym_encrypt_bytea"("bytea", "text") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."pgp_sym_encrypt_bytea"("bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_sym_encrypt_bytea"("bytea", "text", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."pgp_sym_encrypt_bytea"("bytea", "text", "text") FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."pgp_sym_encrypt_bytea"("bytea", "text", "text") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."pgp_sym_encrypt_bytea"("bytea", "text", "text") TO "dashboard_user";


--
-- Name: FUNCTION "uuid_generate_v1"(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."uuid_generate_v1"() FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."uuid_generate_v1"() TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."uuid_generate_v1"() TO "dashboard_user";


--
-- Name: FUNCTION "uuid_generate_v1mc"(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."uuid_generate_v1mc"() FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."uuid_generate_v1mc"() TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."uuid_generate_v1mc"() TO "dashboard_user";


--
-- Name: FUNCTION "uuid_generate_v3"("namespace" "uuid", "name" "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."uuid_generate_v3"("namespace" "uuid", "name" "text") FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."uuid_generate_v3"("namespace" "uuid", "name" "text") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."uuid_generate_v3"("namespace" "uuid", "name" "text") TO "dashboard_user";


--
-- Name: FUNCTION "uuid_generate_v4"(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."uuid_generate_v4"() FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."uuid_generate_v4"() TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."uuid_generate_v4"() TO "dashboard_user";


--
-- Name: FUNCTION "uuid_generate_v5"("namespace" "uuid", "name" "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."uuid_generate_v5"("namespace" "uuid", "name" "text") FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."uuid_generate_v5"("namespace" "uuid", "name" "text") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."uuid_generate_v5"("namespace" "uuid", "name" "text") TO "dashboard_user";


--
-- Name: FUNCTION "uuid_nil"(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."uuid_nil"() FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."uuid_nil"() TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."uuid_nil"() TO "dashboard_user";


--
-- Name: FUNCTION "uuid_ns_dns"(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."uuid_ns_dns"() FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."uuid_ns_dns"() TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."uuid_ns_dns"() TO "dashboard_user";


--
-- Name: FUNCTION "uuid_ns_oid"(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."uuid_ns_oid"() FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."uuid_ns_oid"() TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."uuid_ns_oid"() TO "dashboard_user";


--
-- Name: FUNCTION "uuid_ns_url"(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."uuid_ns_url"() FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."uuid_ns_url"() TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."uuid_ns_url"() TO "dashboard_user";


--
-- Name: FUNCTION "uuid_ns_x500"(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."uuid_ns_x500"() FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."uuid_ns_x500"() TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."uuid_ns_x500"() TO "dashboard_user";


--
-- Name: FUNCTION "_can_continue_project"("p_project_id" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."_can_continue_project"("p_project_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."_can_continue_project"("p_project_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_can_continue_project"("p_project_id" "uuid") TO "service_role";


--
-- Name: FUNCTION "_is_admin_or_owner"("uid" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."_is_admin_or_owner"("uid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."_is_admin_or_owner"("uid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_is_admin_or_owner"("uid" "uuid") TO "service_role";


--
-- Name: FUNCTION "accept_project"("p_project_id" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION "public"."accept_project"("p_project_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."accept_project"("p_project_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."accept_project"("p_project_id" "uuid") TO "service_role";


--
-- Name: FUNCTION "apply_terms_consent_to_profile"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."apply_terms_consent_to_profile"() TO "anon";
GRANT ALL ON FUNCTION "public"."apply_terms_consent_to_profile"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."apply_terms_consent_to_profile"() TO "service_role";


--
-- Name: FUNCTION "can_manage_project"("p_project_id" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION "public"."can_manage_project"("p_project_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."can_manage_project"("p_project_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_manage_project"("p_project_id" "uuid") TO "service_role";


--
-- Name: FUNCTION "citext_cmp"("public"."citext", "public"."citext"); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "public"."citext_cmp"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_cmp"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_cmp"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_cmp"("public"."citext", "public"."citext") TO "service_role";


--
-- Name: FUNCTION "citext_eq"("public"."citext", "public"."citext"); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "public"."citext_eq"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_eq"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_eq"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_eq"("public"."citext", "public"."citext") TO "service_role";


--
-- Name: FUNCTION "citext_ge"("public"."citext", "public"."citext"); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "public"."citext_ge"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_ge"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_ge"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_ge"("public"."citext", "public"."citext") TO "service_role";


--
-- Name: FUNCTION "citext_gt"("public"."citext", "public"."citext"); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "public"."citext_gt"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_gt"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_gt"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_gt"("public"."citext", "public"."citext") TO "service_role";


--
-- Name: FUNCTION "citext_hash"("public"."citext"); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "public"."citext_hash"("public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_hash"("public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_hash"("public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_hash"("public"."citext") TO "service_role";


--
-- Name: FUNCTION "citext_hash_extended"("public"."citext", bigint); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "public"."citext_hash_extended"("public"."citext", bigint) TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_hash_extended"("public"."citext", bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."citext_hash_extended"("public"."citext", bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_hash_extended"("public"."citext", bigint) TO "service_role";


--
-- Name: FUNCTION "citext_larger"("public"."citext", "public"."citext"); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "public"."citext_larger"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_larger"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_larger"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_larger"("public"."citext", "public"."citext") TO "service_role";


--
-- Name: FUNCTION "citext_le"("public"."citext", "public"."citext"); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "public"."citext_le"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_le"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_le"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_le"("public"."citext", "public"."citext") TO "service_role";


--
-- Name: FUNCTION "citext_lt"("public"."citext", "public"."citext"); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "public"."citext_lt"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_lt"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_lt"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_lt"("public"."citext", "public"."citext") TO "service_role";


--
-- Name: FUNCTION "citext_ne"("public"."citext", "public"."citext"); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "public"."citext_ne"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_ne"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_ne"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_ne"("public"."citext", "public"."citext") TO "service_role";


--
-- Name: FUNCTION "citext_pattern_cmp"("public"."citext", "public"."citext"); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "public"."citext_pattern_cmp"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_pattern_cmp"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_pattern_cmp"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_pattern_cmp"("public"."citext", "public"."citext") TO "service_role";


--
-- Name: FUNCTION "citext_pattern_ge"("public"."citext", "public"."citext"); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "public"."citext_pattern_ge"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_pattern_ge"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_pattern_ge"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_pattern_ge"("public"."citext", "public"."citext") TO "service_role";


--
-- Name: FUNCTION "citext_pattern_gt"("public"."citext", "public"."citext"); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "public"."citext_pattern_gt"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_pattern_gt"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_pattern_gt"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_pattern_gt"("public"."citext", "public"."citext") TO "service_role";


--
-- Name: FUNCTION "citext_pattern_le"("public"."citext", "public"."citext"); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "public"."citext_pattern_le"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_pattern_le"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_pattern_le"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_pattern_le"("public"."citext", "public"."citext") TO "service_role";


--
-- Name: FUNCTION "citext_pattern_lt"("public"."citext", "public"."citext"); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "public"."citext_pattern_lt"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_pattern_lt"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_pattern_lt"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_pattern_lt"("public"."citext", "public"."citext") TO "service_role";


--
-- Name: FUNCTION "citext_smaller"("public"."citext", "public"."citext"); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "public"."citext_smaller"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_smaller"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_smaller"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_smaller"("public"."citext", "public"."citext") TO "service_role";


--
-- Name: FUNCTION "continue_project"("p_project_id" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION "public"."continue_project"("p_project_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."continue_project"("p_project_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."continue_project"("p_project_id" "uuid") TO "service_role";


--
-- Name: FUNCTION "drafts_set_version"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."drafts_set_version"() TO "anon";
GRANT ALL ON FUNCTION "public"."drafts_set_version"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."drafts_set_version"() TO "service_role";


--
-- Name: FUNCTION "drafts_touch_updated_at"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."drafts_touch_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."drafts_touch_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."drafts_touch_updated_at"() TO "service_role";


--
-- Name: FUNCTION "gen_unique_username"("base_in" "text", "id_in" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."gen_unique_username"("base_in" "text", "id_in" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."gen_unique_username"("base_in" "text", "id_in" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gen_unique_username"("base_in" "text", "id_in" "uuid") TO "service_role";


--
-- Name: FUNCTION "handle_new_user"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";


--
-- Name: FUNCTION "handle_user_updated"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."handle_user_updated"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_user_updated"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_user_updated"() TO "service_role";


--
-- Name: TABLE "invoice_items"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."invoice_items" TO "anon";
GRANT ALL ON TABLE "public"."invoice_items" TO "authenticated";
GRANT ALL ON TABLE "public"."invoice_items" TO "service_role";


--
-- Name: FUNCTION "invoice_add_custom_item"("p_invoice_id" "uuid", "p_description" "text", "p_qty" numeric, "p_unit_price" numeric, "p_position" integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION "public"."invoice_add_custom_item"("p_invoice_id" "uuid", "p_description" "text", "p_qty" numeric, "p_unit_price" numeric, "p_position" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."invoice_add_custom_item"("p_invoice_id" "uuid", "p_description" "text", "p_qty" numeric, "p_unit_price" numeric, "p_position" integer) TO "service_role";


--
-- Name: FUNCTION "invoice_add_item_from_service"("p_invoice_id" "uuid", "p_service_id" "uuid", "p_qty" numeric, "p_unit_price" numeric, "p_description" "text", "p_position" integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION "public"."invoice_add_item_from_service"("p_invoice_id" "uuid", "p_service_id" "uuid", "p_qty" numeric, "p_unit_price" numeric, "p_description" "text", "p_position" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."invoice_add_item_from_service"("p_invoice_id" "uuid", "p_service_id" "uuid", "p_qty" numeric, "p_unit_price" numeric, "p_description" "text", "p_position" integer) TO "service_role";


--
-- Name: FUNCTION "invoices_next_no"(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION "public"."invoices_next_no"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."invoices_next_no"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."invoices_next_no"() TO "service_role";


--
-- Name: FUNCTION "is_admin"("uid" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."is_admin"("uid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"("uid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"("uid" "uuid") TO "service_role";


--
-- Name: FUNCTION "is_admin_or_owner"(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION "public"."is_admin_or_owner"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_admin_or_owner"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin_or_owner"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin_or_owner"() TO "service_role";


--
-- Name: FUNCTION "is_admin_or_owner"("uid" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."is_admin_or_owner"("uid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin_or_owner"("uid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin_or_owner"("uid" "uuid") TO "service_role";


--
-- Name: FUNCTION "is_assigned_to_project"("uid" "uuid", "pid" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."is_assigned_to_project"("uid" "uuid", "pid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_assigned_to_project"("uid" "uuid", "pid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_assigned_to_project"("uid" "uuid", "pid" "uuid") TO "service_role";


--
-- Name: FUNCTION "next_invoice_no"(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION "public"."next_invoice_no"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."next_invoice_no"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."next_invoice_no"() TO "service_role";


--
-- Name: FUNCTION "progress_from_stage"("p_stage" "public"."project_stage"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."progress_from_stage"("p_stage" "public"."project_stage") TO "anon";
GRANT ALL ON FUNCTION "public"."progress_from_stage"("p_stage" "public"."project_stage") TO "authenticated";
GRANT ALL ON FUNCTION "public"."progress_from_stage"("p_stage" "public"."project_stage") TO "service_role";


--
-- Name: FUNCTION "propagate_project_client_id_to_meetings"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."propagate_project_client_id_to_meetings"() TO "anon";
GRANT ALL ON FUNCTION "public"."propagate_project_client_id_to_meetings"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."propagate_project_client_id_to_meetings"() TO "service_role";


--
-- Name: FUNCTION "purge_expired_operational_data"(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION "public"."purge_expired_operational_data"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."purge_expired_operational_data"() TO "service_role";


--
-- Name: FUNCTION "put_project_on_hold"("p_project_id" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION "public"."put_project_on_hold"("p_project_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."put_project_on_hold"("p_project_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."put_project_on_hold"("p_project_id" "uuid") TO "service_role";


--
-- Name: FUNCTION "recalc_invoice_total"(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION "public"."recalc_invoice_total"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."recalc_invoice_total"() TO "anon";
GRANT ALL ON FUNCTION "public"."recalc_invoice_total"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."recalc_invoice_total"() TO "service_role";


--
-- Name: FUNCTION "regexp_match"("public"."citext", "public"."citext"); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext") TO "service_role";


--
-- Name: FUNCTION "regexp_match"("public"."citext", "public"."citext", "text"); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext", "text") TO "service_role";


--
-- Name: FUNCTION "regexp_matches"("public"."citext", "public"."citext"); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext") TO "service_role";


--
-- Name: FUNCTION "regexp_matches"("public"."citext", "public"."citext", "text"); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext", "text") TO "service_role";


--
-- Name: FUNCTION "regexp_replace"("public"."citext", "public"."citext", "text"); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text") TO "service_role";


--
-- Name: FUNCTION "regexp_replace"("public"."citext", "public"."citext", "text", "text"); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text", "text") TO "service_role";


--
-- Name: FUNCTION "regexp_split_to_array"("public"."citext", "public"."citext"); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext") TO "service_role";


--
-- Name: FUNCTION "regexp_split_to_array"("public"."citext", "public"."citext", "text"); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext", "text") TO "service_role";


--
-- Name: FUNCTION "regexp_split_to_table"("public"."citext", "public"."citext"); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext") TO "service_role";


--
-- Name: FUNCTION "regexp_split_to_table"("public"."citext", "public"."citext", "text"); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext", "text") TO "service_role";


--
-- Name: FUNCTION "replace"("public"."citext", "public"."citext", "public"."citext"); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "public"."replace"("public"."citext", "public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."replace"("public"."citext", "public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."replace"("public"."citext", "public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."replace"("public"."citext", "public"."citext", "public"."citext") TO "service_role";


--
-- Name: FUNCTION "resume_project"("p_project_id" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION "public"."resume_project"("p_project_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."resume_project"("p_project_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."resume_project"("p_project_id" "uuid") TO "service_role";


--
-- Name: FUNCTION "set_meeting_created_by"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."set_meeting_created_by"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_meeting_created_by"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_meeting_created_by"() TO "service_role";


--
-- Name: FUNCTION "set_meetings_client_id_from_project"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."set_meetings_client_id_from_project"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_meetings_client_id_from_project"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_meetings_client_id_from_project"() TO "service_role";


--
-- Name: FUNCTION "set_ref_link_created_by"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."set_ref_link_created_by"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_ref_link_created_by"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_ref_link_created_by"() TO "service_role";


--
-- Name: FUNCTION "set_updated_at"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";


--
-- Name: FUNCTION "split_part"("public"."citext", "public"."citext", integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "public"."split_part"("public"."citext", "public"."citext", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."split_part"("public"."citext", "public"."citext", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."split_part"("public"."citext", "public"."citext", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."split_part"("public"."citext", "public"."citext", integer) TO "service_role";


--
-- Name: FUNCTION "strpos"("public"."citext", "public"."citext"); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "public"."strpos"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."strpos"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."strpos"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strpos"("public"."citext", "public"."citext") TO "service_role";


--
-- Name: FUNCTION "submit_project_request"("p_user_id" "uuid", "p_idempotency_key" "uuid", "p_project" "jsonb", "p_items" "jsonb", "p_references" "jsonb"); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION "public"."submit_project_request"("p_user_id" "uuid", "p_idempotency_key" "uuid", "p_project" "jsonb", "p_items" "jsonb", "p_references" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."submit_project_request"("p_user_id" "uuid", "p_idempotency_key" "uuid", "p_project" "jsonb", "p_items" "jsonb", "p_references" "jsonb") TO "service_role";


--
-- Name: FUNCTION "sync_terms_consent_from_auth"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."sync_terms_consent_from_auth"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_terms_consent_from_auth"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_terms_consent_from_auth"() TO "service_role";


--
-- Name: FUNCTION "texticlike"("public"."citext", "text"); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "text") TO "service_role";


--
-- Name: FUNCTION "texticlike"("public"."citext", "public"."citext"); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "public"."citext") TO "service_role";


--
-- Name: FUNCTION "texticnlike"("public"."citext", "text"); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "text") TO "service_role";


--
-- Name: FUNCTION "texticnlike"("public"."citext", "public"."citext"); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "public"."citext") TO "service_role";


--
-- Name: FUNCTION "texticregexeq"("public"."citext", "text"); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "text") TO "service_role";


--
-- Name: FUNCTION "texticregexeq"("public"."citext", "public"."citext"); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "public"."citext") TO "service_role";


--
-- Name: FUNCTION "texticregexne"("public"."citext", "text"); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "text") TO "service_role";


--
-- Name: FUNCTION "texticregexne"("public"."citext", "public"."citext"); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "public"."citext") TO "service_role";


--
-- Name: FUNCTION "translate"("public"."citext", "public"."citext", "text"); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "public"."translate"("public"."citext", "public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."translate"("public"."citext", "public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."translate"("public"."citext", "public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."translate"("public"."citext", "public"."citext", "text") TO "service_role";


--
-- Name: FUNCTION "trigger_set_timestamp"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."trigger_set_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_set_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_set_timestamp"() TO "service_role";


--
-- Name: FUNCTION "validate_assignment_matches_staff_role"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."validate_assignment_matches_staff_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_assignment_matches_staff_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_assignment_matches_staff_role"() TO "service_role";


--
-- Name: FUNCTION "_crypto_aead_det_decrypt"("message" "bytea", "additional" "bytea", "key_id" bigint, "context" "bytea", "nonce" "bytea"); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "vault"."_crypto_aead_det_decrypt"("message" "bytea", "additional" "bytea", "key_id" bigint, "context" "bytea", "nonce" "bytea") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "vault"."_crypto_aead_det_decrypt"("message" "bytea", "additional" "bytea", "key_id" bigint, "context" "bytea", "nonce" "bytea") TO "service_role";


--
-- Name: FUNCTION "create_secret"("new_secret" "text", "new_name" "text", "new_description" "text", "new_key_id" "uuid"); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "vault"."create_secret"("new_secret" "text", "new_name" "text", "new_description" "text", "new_key_id" "uuid") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "vault"."create_secret"("new_secret" "text", "new_name" "text", "new_description" "text", "new_key_id" "uuid") TO "service_role";


--
-- Name: FUNCTION "update_secret"("secret_id" "uuid", "new_secret" "text", "new_name" "text", "new_description" "text", "new_key_id" "uuid"); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "vault"."update_secret"("secret_id" "uuid", "new_secret" "text", "new_name" "text", "new_description" "text", "new_key_id" "uuid") TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "vault"."update_secret"("secret_id" "uuid", "new_secret" "text", "new_name" "text", "new_description" "text", "new_key_id" "uuid") TO "service_role";


--
-- Name: FUNCTION "max"("public"."citext"); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "public"."max"("public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."max"("public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."max"("public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."max"("public"."citext") TO "service_role";


--
-- Name: FUNCTION "min"("public"."citext"); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "public"."min"("public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."min"("public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."min"("public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."min"("public"."citext") TO "service_role";


--
-- Name: TABLE "pg_stat_statements"; Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON TABLE "extensions"."pg_stat_statements" FROM "postgres";
GRANT ALL ON TABLE "extensions"."pg_stat_statements" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "extensions"."pg_stat_statements" TO "dashboard_user";


--
-- Name: TABLE "pg_stat_statements_info"; Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON TABLE "extensions"."pg_stat_statements_info" FROM "postgres";
GRANT ALL ON TABLE "extensions"."pg_stat_statements_info" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "extensions"."pg_stat_statements_info" TO "dashboard_user";


--
-- Name: TABLE "app_error_events"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."app_error_events" TO "anon";
GRANT ALL ON TABLE "public"."app_error_events" TO "authenticated";
GRANT ALL ON TABLE "public"."app_error_events" TO "service_role";


--
-- Name: TABLE "assignments"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."assignments" TO "anon";
GRANT ALL ON TABLE "public"."assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."assignments" TO "service_role";


--
-- Name: TABLE "profiles"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT SELECT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";


--
-- Name: COLUMN "profiles"."name"; Type: ACL; Schema: public; Owner: postgres
--

GRANT UPDATE("name") ON TABLE "public"."profiles" TO "authenticated";


--
-- Name: COLUMN "profiles"."avatar_url"; Type: ACL; Schema: public; Owner: postgres
--

GRANT UPDATE("avatar_url") ON TABLE "public"."profiles" TO "authenticated";


--
-- Name: COLUMN "profiles"."first_name"; Type: ACL; Schema: public; Owner: postgres
--

GRANT UPDATE("first_name") ON TABLE "public"."profiles" TO "authenticated";


--
-- Name: COLUMN "profiles"."last_name"; Type: ACL; Schema: public; Owner: postgres
--

GRANT UPDATE("last_name") ON TABLE "public"."profiles" TO "authenticated";


--
-- Name: COLUMN "profiles"."artist_name"; Type: ACL; Schema: public; Owner: postgres
--

GRANT UPDATE("artist_name") ON TABLE "public"."profiles" TO "authenticated";


--
-- Name: COLUMN "profiles"."location"; Type: ACL; Schema: public; Owner: postgres
--

GRANT UPDATE("location") ON TABLE "public"."profiles" TO "authenticated";


--
-- Name: COLUMN "profiles"."phone_number"; Type: ACL; Schema: public; Owner: postgres
--

GRANT UPDATE("phone_number") ON TABLE "public"."profiles" TO "authenticated";


--
-- Name: COLUMN "profiles"."avatar_path"; Type: ACL; Schema: public; Owner: postgres
--

GRANT UPDATE("avatar_path") ON TABLE "public"."profiles" TO "authenticated";


--
-- Name: COLUMN "profiles"."username"; Type: ACL; Schema: public; Owner: postgres
--

GRANT UPDATE("username") ON TABLE "public"."profiles" TO "authenticated";


--
-- Name: TABLE "assignment_view"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."assignment_view" TO "anon";
GRANT ALL ON TABLE "public"."assignment_view" TO "authenticated";
GRANT ALL ON TABLE "public"."assignment_view" TO "service_role";


--
-- Name: TABLE "bundle_items"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."bundle_items" TO "anon";
GRANT ALL ON TABLE "public"."bundle_items" TO "authenticated";
GRANT ALL ON TABLE "public"."bundle_items" TO "service_role";


--
-- Name: TABLE "bundles"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."bundles" TO "anon";
GRANT ALL ON TABLE "public"."bundles" TO "authenticated";
GRANT ALL ON TABLE "public"."bundles" TO "service_role";


--
-- Name: TABLE "clients"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."clients" TO "anon";
GRANT ALL ON TABLE "public"."clients" TO "authenticated";
GRANT ALL ON TABLE "public"."clients" TO "service_role";


--
-- Name: TABLE "contact_inquiries"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."contact_inquiries" TO "service_role";


--
-- Name: TABLE "data_privacy_requests"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."data_privacy_requests" TO "anon";
GRANT ALL ON TABLE "public"."data_privacy_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."data_privacy_requests" TO "service_role";


--
-- Name: TABLE "data_retention_rules"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."data_retention_rules" TO "anon";
GRANT ALL ON TABLE "public"."data_retention_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."data_retention_rules" TO "service_role";


--
-- Name: TABLE "discussion_messages"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."discussion_messages" TO "anon";
GRANT ALL ON TABLE "public"."discussion_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."discussion_messages" TO "service_role";


--
-- Name: TABLE "discussion_messages_view"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."discussion_messages_view" TO "anon";
GRANT ALL ON TABLE "public"."discussion_messages_view" TO "authenticated";
GRANT ALL ON TABLE "public"."discussion_messages_view" TO "service_role";


--
-- Name: TABLE "distributions"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."distributions" TO "anon";
GRANT ALL ON TABLE "public"."distributions" TO "authenticated";
GRANT ALL ON TABLE "public"."distributions" TO "service_role";


--
-- Name: TABLE "drafts"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."drafts" TO "anon";
GRANT ALL ON TABLE "public"."drafts" TO "authenticated";
GRANT ALL ON TABLE "public"."drafts" TO "service_role";


--
-- Name: TABLE "feedbacks"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."feedbacks" TO "anon";
GRANT ALL ON TABLE "public"."feedbacks" TO "authenticated";
GRANT ALL ON TABLE "public"."feedbacks" TO "service_role";


--
-- Name: TABLE "music_genres"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."music_genres" TO "anon";
GRANT ALL ON TABLE "public"."music_genres" TO "authenticated";
GRANT ALL ON TABLE "public"."music_genres" TO "service_role";


--
-- Name: TABLE "genre_summary"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."genre_summary" TO "anon";
GRANT ALL ON TABLE "public"."genre_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."genre_summary" TO "service_role";


--
-- Name: TABLE "invoice_delivery_logs"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."invoice_delivery_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."invoice_delivery_logs" TO "service_role";


--
-- Name: TABLE "invoices"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."invoices" TO "anon";
GRANT ALL ON TABLE "public"."invoices" TO "authenticated";
GRANT ALL ON TABLE "public"."invoices" TO "service_role";


--
-- Name: SEQUENCE "invoices_no_seq"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE "public"."invoices_no_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."invoices_no_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."invoices_no_seq" TO "service_role";


--
-- Name: TABLE "meetings"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."meetings" TO "anon";
GRANT ALL ON TABLE "public"."meetings" TO "authenticated";
GRANT ALL ON TABLE "public"."meetings" TO "service_role";


--
-- Name: SEQUENCE "music_genres_id_seq"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE "public"."music_genres_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."music_genres_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."music_genres_id_seq" TO "service_role";


--
-- Name: TABLE "payment_schedules"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."payment_schedules" TO "anon";
GRANT ALL ON TABLE "public"."payment_schedules" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_schedules" TO "service_role";


--
-- Name: TABLE "payment_transactions"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."payment_transactions" TO "anon";
GRANT ALL ON TABLE "public"."payment_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_transactions" TO "service_role";


--
-- Name: TABLE "payments"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";


--
-- Name: TABLE "portfolio"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."portfolio" TO "anon";
GRANT ALL ON TABLE "public"."portfolio" TO "authenticated";
GRANT ALL ON TABLE "public"."portfolio" TO "service_role";


--
-- Name: SEQUENCE "portfolio_id_seq"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE "public"."portfolio_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."portfolio_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."portfolio_id_seq" TO "service_role";


--
-- Name: TABLE "projects"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."projects" TO "anon";
GRANT ALL ON TABLE "public"."projects" TO "authenticated";
GRANT ALL ON TABLE "public"."projects" TO "service_role";


--
-- Name: TABLE "revisions"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."revisions" TO "anon";
GRANT ALL ON TABLE "public"."revisions" TO "authenticated";
GRANT ALL ON TABLE "public"."revisions" TO "service_role";


--
-- Name: TABLE "project_activity"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."project_activity" TO "anon";
GRANT ALL ON TABLE "public"."project_activity" TO "authenticated";
GRANT ALL ON TABLE "public"."project_activity" TO "service_role";


--
-- Name: TABLE "project_latest_update"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."project_latest_update" TO "anon";
GRANT ALL ON TABLE "public"."project_latest_update" TO "authenticated";
GRANT ALL ON TABLE "public"."project_latest_update" TO "service_role";


--
-- Name: TABLE "project_milestones"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."project_milestones" TO "anon";
GRANT ALL ON TABLE "public"."project_milestones" TO "authenticated";
GRANT ALL ON TABLE "public"."project_milestones" TO "service_role";


--
-- Name: TABLE "project_order_items"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."project_order_items" TO "anon";
GRANT ALL ON TABLE "public"."project_order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."project_order_items" TO "service_role";


--
-- Name: TABLE "project_services"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."project_services" TO "anon";
GRANT ALL ON TABLE "public"."project_services" TO "authenticated";
GRANT ALL ON TABLE "public"."project_services" TO "service_role";


--
-- Name: TABLE "project_summary"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."project_summary" TO "anon";
GRANT ALL ON TABLE "public"."project_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."project_summary" TO "service_role";


--
-- Name: TABLE "publishing_analytics"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."publishing_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."publishing_analytics" TO "service_role";


--
-- Name: TABLE "publishing_delivery_logs"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."publishing_delivery_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."publishing_delivery_logs" TO "service_role";


--
-- Name: TABLE "reference_links"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."reference_links" TO "anon";
GRANT ALL ON TABLE "public"."reference_links" TO "authenticated";
GRANT ALL ON TABLE "public"."reference_links" TO "service_role";


--
-- Name: TABLE "roles"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."roles" TO "anon";
GRANT ALL ON TABLE "public"."roles" TO "authenticated";
GRANT ALL ON TABLE "public"."roles" TO "service_role";


--
-- Name: TABLE "services"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."services" TO "anon";
GRANT ALL ON TABLE "public"."services" TO "authenticated";
GRANT ALL ON TABLE "public"."services" TO "service_role";


--
-- Name: TABLE "staff_list"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."staff_list" TO "anon";
GRANT ALL ON TABLE "public"."staff_list" TO "authenticated";
GRANT ALL ON TABLE "public"."staff_list" TO "service_role";


--
-- Name: TABLE "secrets"; Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT SELECT,REFERENCES,DELETE,TRUNCATE ON TABLE "vault"."secrets" TO "postgres" WITH GRANT OPTION;
GRANT SELECT,DELETE ON TABLE "vault"."secrets" TO "service_role";


--
-- Name: TABLE "decrypted_secrets"; Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT SELECT,REFERENCES,DELETE,TRUNCATE ON TABLE "vault"."decrypted_secrets" TO "postgres" WITH GRANT OPTION;
GRANT SELECT,DELETE ON TABLE "vault"."decrypted_secrets" TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";


--
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER "issue_graphql_placeholder" ON "sql_drop"
         WHEN TAG IN ('DROP EXTENSION')
   EXECUTE FUNCTION "extensions"."set_graphql_placeholder"();


ALTER EVENT TRIGGER "issue_graphql_placeholder" OWNER TO "supabase_admin";

--
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER "issue_pg_cron_access" ON "ddl_command_end"
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION "extensions"."grant_pg_cron_access"();


ALTER EVENT TRIGGER "issue_pg_cron_access" OWNER TO "supabase_admin";

--
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER "issue_pg_graphql_access" ON "ddl_command_end"
         WHEN TAG IN ('CREATE FUNCTION')
   EXECUTE FUNCTION "extensions"."grant_pg_graphql_access"();


ALTER EVENT TRIGGER "issue_pg_graphql_access" OWNER TO "supabase_admin";

--
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER "issue_pg_net_access" ON "ddl_command_end"
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION "extensions"."grant_pg_net_access"();


ALTER EVENT TRIGGER "issue_pg_net_access" OWNER TO "supabase_admin";

--
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER "pgrst_ddl_watch" ON "ddl_command_end"
   EXECUTE FUNCTION "extensions"."pgrst_ddl_watch"();


ALTER EVENT TRIGGER "pgrst_ddl_watch" OWNER TO "supabase_admin";

--
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER "pgrst_drop_watch" ON "sql_drop"
   EXECUTE FUNCTION "extensions"."pgrst_drop_watch"();


ALTER EVENT TRIGGER "pgrst_drop_watch" OWNER TO "supabase_admin";

--
-- PostgreSQL database dump complete
--
