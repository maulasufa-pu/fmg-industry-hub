begin;

insert into public.roles(id, name, sort_order) values
  ('owner','Owner',10),('admin','Administrator',20),('anr','A&R',30),('composer','Composer',40),
  ('producer','Producer',50),('engineer','Engineer',60),('publisher','Publisher',70),('client','Client',80),('guest','Guest',90)
on conflict(id) do update set name=excluded.name, sort_order=excluded.sort_order;

insert into public.services(service_key,label,group_name,price,is_subscription,is_active,sort_order) values
  ('songwriting','Songwriting (Lyrics & Melody)','core',350,false,true,10),
  ('composition','Composition','core',350,false,true,20),
  ('arrangement','Arrangement','core',350,false,true,30),
  ('digital_production','Digital Audio Production','core',500,false,true,40),
  ('sound_design','Sound Design','core',250,false,true,50),
  ('editing','Editing','core',120,false,true,60),
  ('mixing','Mixing','core',250,false,true,70),
  ('mastering','Mastering','core',150,false,true,80),
  ('publishing_admin','Distribution Administration','core',150,false,true,90),
  ('recording_studio','Recording Studio','additional',200,false,true,100),
  ('vocal_directing','Vocal Directing','additional',150,false,true,110),
  ('mv_directing','Music Video Directing & Production','business',1000,false,true,120),
  ('social_media_mgmt','Social Media Management (per month)','business',300,true,true,130),
  ('artist_management','Artist Management (per month)','business',600,true,true,140),
  ('music_marketing','Music Marketing (per month)','business',500,true,true,150)
on conflict(service_key) do update set label=excluded.label, group_name=excluded.group_name, price=excluded.price, is_subscription=excluded.is_subscription, is_active=excluded.is_active, sort_order=excluded.sort_order;

insert into public.bundles(bundle_key,label,bundle_price,description,is_active,sort_order) values
  ('basic','Basic',700,'For personal releases and focused arrangement work.',true,10),
  ('pro','Pro',1000,'For serious digital releases requiring complete production.',true,20),
  ('ultimate','Ultimate',2000,'For labels, brands, film, advertising, and professional artists.',true,30)
on conflict(bundle_key) do update set label=excluded.label, bundle_price=excluded.bundle_price, description=excluded.description, is_active=excluded.is_active, sort_order=excluded.sort_order;

with wanted(bundle_key,service_key) as (values
  ('basic','composition'),('basic','arrangement'),('basic','digital_production'),('basic','editing'),('basic','mixing'),('basic','mastering'),('basic','vocal_directing'),
  ('pro','songwriting'),('pro','composition'),('pro','arrangement'),('pro','digital_production'),('pro','sound_design'),('pro','editing'),('pro','mixing'),('pro','mastering'),('pro','recording_studio'),('pro','vocal_directing'),
  ('ultimate','songwriting'),('ultimate','composition'),('ultimate','arrangement'),('ultimate','digital_production'),('ultimate','sound_design'),('ultimate','editing'),('ultimate','mixing'),('ultimate','mastering'),('ultimate','publishing_admin'),('ultimate','recording_studio'),('ultimate','vocal_directing'),('ultimate','mv_directing'),('ultimate','social_media_mgmt'),('ultimate','artist_management')
)
insert into public.bundle_items(bundle_id,service_id)
select b.id,s.id from wanted w join public.bundles b on b.bundle_key=w.bundle_key join public.services s on s.service_key=w.service_key
where not exists(select 1 from public.bundle_items bi where bi.bundle_id=b.id and bi.service_id=s.id);

insert into public.music_genres(genre,sub_genre)
select seed.genre, seed.sub_genre from (values
  ('Pop','Pop'),('Pop','Indie Pop'),('Pop','Pop Ballad'),('Rock','Alternative Rock'),('Rock','Pop Rock'),
  ('Hip-Hop/Rap','Hip-Hop'),('Hip-Hop/Rap','Trap'),('R&B/Soul','Contemporary R&B'),('Jazz','Jazz'),('Jazz','Bossa Nova'),
  ('Electronic','EDM'),('Electronic','House'),('Folk Music','Indie Folk'),('Classical','Orchestral'),('World','Dangdut')
) as seed(genre,sub_genre)
where not exists(select 1 from public.music_genres g where g.genre=seed.genre and g.sub_genre=seed.sub_genre);

commit;
