begin;

insert into public.bundles (
  bundle_key, label, bundle_price, note, description, is_active, sort_order,
  promo_type, promo_value, promo_start, promo_end
)
values (
  'new_customer_arrangement_promo',
  'Paket Hemat Customer Baru',
  339.10,
  'Khusus customer baru. Harga Indonesia tetap Rp6.000.000; mata uang lain mengikuti kurs.',
  'Composition, arrangement, digital audio production, editing, mixing, mastering, dan vocal directing.',
  true,
  -10,
  'none',
  6000000,
  null,
  null
)
on conflict (bundle_key) do update set
  label = excluded.label,
  bundle_price = excluded.bundle_price,
  note = excluded.note,
  description = excluded.description,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order,
  promo_type = excluded.promo_type,
  promo_value = excluded.promo_value,
  promo_start = excluded.promo_start,
  promo_end = excluded.promo_end,
  updated_at = now();

insert into public.bundle_items (bundle_id, service_id)
select b.id, s.id
from public.bundles b
join public.services s on s.service_key in (
  'composition', 'arrangement', 'digital_production', 'editing',
  'mixing', 'mastering', 'vocal_directing'
)
where b.bundle_key = 'new_customer_arrangement_promo'
on conflict (bundle_id, service_id) do nothing;

commit;
