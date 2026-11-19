-- GYOMO FISH HOUSE: SUPABASE SETUP
-- Jalankan seluruh isi file ini di Supabase > SQL Editor > New query.

create extension if not exists pgcrypto;

-- 1. Pengaturan website: pengumuman dan jadwal live cutting
create table if not exists public.gyomo_settings (
  id integer primary key check (id = 1),
  announcement_active boolean not null default false,
  announcement_title text not null default '',
  announcement_message text not null default '',
  announcement_link text not null default '',
  announcement_link_text text not null default 'MORE INFO',
  fish_name text not null default 'BLUEFIN TUNA',
  fish_weight text not null default '25 KG',
  event_day integer not null default 6 check (event_day between 0 and 6),
  event_hour integer not null default 19 check (event_hour between 0 and 23),
  event_minute integer not null default 0 check (event_minute between 0 and 59),
  updated_at timestamptz not null default now()
);

insert into public.gyomo_settings (id)
values (1)
on conflict (id) do nothing;

-- 2. Daftar akun yang boleh menjadi admin
create table if not exists public.gyomo_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- 3. Menu yang ditampilkan di website
create table if not exists public.gyomo_menu (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  price text not null,
  category text not null check (category in ('sushi','grill','signature')),
  image_url text not null,
  is_available boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Aktifkan Row Level Security
alter table public.gyomo_settings enable row level security;
alter table public.gyomo_admins enable row level security;
alter table public.gyomo_menu enable row level security;

-- Fungsi pengecekan admin. SECURITY DEFINER menghindari policy berputar.
create or replace function public.gyomo_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.gyomo_admins
    where user_id = auth.uid()
  );
$$;

revoke all on function public.gyomo_is_admin() from public;
grant execute on function public.gyomo_is_admin() to anon, authenticated;

-- Hapus policy lama bila script dijalankan ulang.
drop policy if exists "Gyomo settings readable by everyone" on public.gyomo_settings;
drop policy if exists "Gyomo settings managed by admins" on public.gyomo_settings;
drop policy if exists "Gyomo admins can read own row" on public.gyomo_admins;
drop policy if exists "Gyomo menu public reads available items" on public.gyomo_menu;
drop policy if exists "Gyomo menu admins read all" on public.gyomo_menu;
drop policy if exists "Gyomo menu admins insert" on public.gyomo_menu;
drop policy if exists "Gyomo menu admins update" on public.gyomo_menu;
drop policy if exists "Gyomo menu admins delete" on public.gyomo_menu;

-- Pengunjung boleh membaca pengaturan (untuk countdown dan pengumuman).
create policy "Gyomo settings readable by everyone"
on public.gyomo_settings for select
to anon, authenticated
using (true);

-- Hanya admin yang boleh mengubah pengaturan.
create policy "Gyomo settings managed by admins"
on public.gyomo_settings for all
to authenticated
using (public.gyomo_is_admin())
with check (public.gyomo_is_admin());

-- Akun login boleh membaca baris admin miliknya sendiri.
create policy "Gyomo admins can read own row"
on public.gyomo_admins for select
to authenticated
using (user_id = auth.uid());

-- Pengunjung hanya boleh membaca menu yang tersedia.
create policy "Gyomo menu public reads available items"
on public.gyomo_menu for select
to anon, authenticated
using (is_available = true);

-- Admin boleh membaca semua menu termasuk yang disembunyikan.
create policy "Gyomo menu admins read all"
on public.gyomo_menu for select
to authenticated
using (public.gyomo_is_admin());

create policy "Gyomo menu admins insert"
on public.gyomo_menu for insert
to authenticated
with check (public.gyomo_is_admin());

create policy "Gyomo menu admins update"
on public.gyomo_menu for update
to authenticated
using (public.gyomo_is_admin())
with check (public.gyomo_is_admin());

create policy "Gyomo menu admins delete"
on public.gyomo_menu for delete
to authenticated
using (public.gyomo_is_admin());

-- 4. Tempat penyimpanan foto menu.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('gyomo-menu', 'gyomo-menu', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
set public = true,
    file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists "Gyomo menu photos are public" on storage.objects;
drop policy if exists "Gyomo admins upload menu photos" on storage.objects;
drop policy if exists "Gyomo admins update menu photos" on storage.objects;
drop policy if exists "Gyomo admins delete menu photos" on storage.objects;

create policy "Gyomo menu photos are public"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'gyomo-menu');

create policy "Gyomo admins upload menu photos"
on storage.objects for insert
to authenticated
with check (bucket_id = 'gyomo-menu' and public.gyomo_is_admin());

create policy "Gyomo admins update menu photos"
on storage.objects for update
to authenticated
using (bucket_id = 'gyomo-menu' and public.gyomo_is_admin())
with check (bucket_id = 'gyomo-menu' and public.gyomo_is_admin());

create policy "Gyomo admins delete menu photos"
on storage.objects for delete
to authenticated
using (bucket_id = 'gyomo-menu' and public.gyomo_is_admin());

-- SELESAI. Setelah ini buat akun admin dan masukkan UUID akun itu
-- ke tabel public.gyomo_admins. Petunjuk lengkap ada di README-setup.txt.
