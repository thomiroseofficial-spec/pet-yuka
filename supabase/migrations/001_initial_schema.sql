-- Pet Yuka — Initial Database Schema
-- Run via Supabase Dashboard > SQL Editor

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================================
-- USERS (extends Supabase auth.users)
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  tier text not null default 'free' check (tier in ('free', 'premium')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
create policy "Users can read own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'display_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- INGREDIENTS (canonical master list)
-- ============================================================
create table public.ingredients (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  aliases text[] not null default '{}',
  category text,
  created_at timestamptz not null default now()
);

alter table public.ingredients enable row level security;
create policy "Ingredients are publicly readable" on public.ingredients
  for select using (true);

-- ============================================================
-- PRODUCTS
-- ============================================================
create table public.products (
  id uuid primary key default uuid_generate_v4(),
  barcode text unique,
  name text not null,
  brand text not null default '',
  image_url text,
  source text not null default 'manual' check (source in ('barcode', 'ocr', 'manual')),
  verified boolean not null default false,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index idx_products_barcode on public.products(barcode) where barcode is not null;

alter table public.products enable row level security;
create policy "Products are publicly readable" on public.products
  for select using (true);
create policy "Authenticated users can insert products" on public.products
  for insert with check (auth.uid() is not null);

-- ============================================================
-- PRODUCT_INGREDIENTS (join table, ordered by weight)
-- ============================================================
create table public.product_ingredients (
  product_id uuid not null references public.products(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id),
  position int not null, -- weight order (1 = highest)
  primary key (product_id, ingredient_id)
);

alter table public.product_ingredients enable row level security;
create policy "Product ingredients are publicly readable" on public.product_ingredients
  for select using (true);
create policy "Authenticated users can insert product ingredients" on public.product_ingredients
  for insert with check (auth.uid() is not null);

-- ============================================================
-- FRAMEWORKS
-- ============================================================
create table public.frameworks (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  author text not null,
  description text not null default '',
  version text not null default '1.0.0',
  status text not null default 'active' check (status in ('draft', 'active', 'deprecated')),
  follower_count int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.frameworks enable row level security;
create policy "Frameworks are publicly readable" on public.frameworks
  for select using (true);

-- ============================================================
-- CRITERIA (framework evaluation rules)
-- ============================================================
create table public.criteria (
  id uuid primary key default uuid_generate_v4(),
  framework_id uuid not null references public.frameworks(id) on delete cascade,
  ingredient text not null,
  rule text not null check (rule in ('blocklist', 'allowlist', 'cap_by_percentage', 'prefer')),
  score_impact int not null check (score_impact between -100 and 100),
  reason text not null default ''
);

create index idx_criteria_framework on public.criteria(framework_id);

alter table public.criteria enable row level security;
create policy "Criteria are publicly readable" on public.criteria
  for select using (true);

-- ============================================================
-- SCORES (cache table)
-- ============================================================
create table public.scores (
  product_id uuid not null references public.products(id) on delete cascade,
  framework_id uuid not null references public.frameworks(id) on delete cascade,
  score int not null check (score between 0 and 100),
  computed_at timestamptz not null default now(),
  framework_version text not null,
  primary key (product_id, framework_id)
);

alter table public.scores enable row level security;
create policy "Scores are publicly readable" on public.scores
  for select using (true);

-- ============================================================
-- USER_FRAMEWORKS (which frameworks a user follows)
-- ============================================================
create table public.user_frameworks (
  user_id uuid not null references auth.users(id) on delete cascade,
  framework_id uuid not null references public.frameworks(id) on delete cascade,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (user_id, framework_id)
);

alter table public.user_frameworks enable row level security;
create policy "Users can read own follows" on public.user_frameworks
  for select using (auth.uid() = user_id);
create policy "Users can manage own follows" on public.user_frameworks
  for all using (auth.uid() = user_id);

-- ============================================================
-- SCAN_HISTORY
-- ============================================================
create table public.scan_history (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  scanned_at timestamptz not null default now()
);

create index idx_scan_history_user on public.scan_history(user_id, scanned_at desc);

alter table public.scan_history enable row level security;
create policy "Users can read own scan history" on public.scan_history
  for select using (auth.uid() = user_id);
create policy "Users can insert own scans" on public.scan_history
  for insert with check (auth.uid() = user_id);

-- ============================================================
-- SEED DATA: Initial frameworks + criteria
-- ============================================================
insert into public.frameworks (id, name, author, description, version, follower_count) values
  ('f0000001-0000-0000-0000-000000000001', 'Dr. Kim''s Vet Standard', 'Dr. Kim, DVM', 'Evidence-based pet nutrition evaluation', '1.0.0', 12400),
  ('f0000001-0000-0000-0000-000000000002', 'BARF Diet Community', 'BARF Community', 'Raw feeding philosophy — biologically appropriate raw food', '1.0.0', 8200),
  ('f0000001-0000-0000-0000-000000000003', 'PetNutrition (YT)', 'PetNutrition Channel', 'Popular pet food reviewer on YouTube', '1.0.0', 5100);

-- Dr. Kim's criteria
insert into public.criteria (framework_id, ingredient, rule, score_impact, reason) values
  ('f0000001-0000-0000-0000-000000000001', 'chicken breast', 'prefer', 25, 'High quality animal protein'),
  ('f0000001-0000-0000-0000-000000000001', 'chicken', 'prefer', 20, 'Good protein source'),
  ('f0000001-0000-0000-0000-000000000001', 'beef', 'prefer', 20, 'Quality red meat protein'),
  ('f0000001-0000-0000-0000-000000000001', 'salmon', 'prefer', 22, 'Excellent protein + omega-3'),
  ('f0000001-0000-0000-0000-000000000001', 'salmon oil', 'prefer', 20, 'Rich omega-3 source for coat and joints'),
  ('f0000001-0000-0000-0000-000000000001', 'sweet potato', 'allowlist', 15, 'Good complex carbohydrate'),
  ('f0000001-0000-0000-0000-000000000001', 'blueberry', 'prefer', 10, 'Antioxidant-rich superfood'),
  ('f0000001-0000-0000-0000-000000000001', 'pumpkin', 'prefer', 12, 'Great for digestive health'),
  ('f0000001-0000-0000-0000-000000000001', 'BHA', 'blocklist', -40, 'Synthetic preservative linked to cancer in animals'),
  ('f0000001-0000-0000-0000-000000000001', 'BHT', 'blocklist', -35, 'Synthetic preservative with health concerns'),
  ('f0000001-0000-0000-0000-000000000001', 'ethoxyquin', 'blocklist', -45, 'Controversial preservative banned in some countries'),
  ('f0000001-0000-0000-0000-000000000001', 'propylene glycol', 'blocklist', -30, 'Chemical additive unsafe for pets'),
  ('f0000001-0000-0000-0000-000000000001', 'corn', 'blocklist', -15, 'Common allergen with low nutritional value'),
  ('f0000001-0000-0000-0000-000000000001', 'wheat', 'blocklist', -15, 'Common allergen'),
  ('f0000001-0000-0000-0000-000000000001', 'soy', 'blocklist', -12, 'Potential allergen and endocrine disruptor'),
  ('f0000001-0000-0000-0000-000000000001', 'chicken by-product', 'blocklist', -20, 'Low quality protein source'),
  ('f0000001-0000-0000-0000-000000000001', 'meat by-product', 'blocklist', -25, 'Unspecified low quality protein'),
  ('f0000001-0000-0000-0000-000000000001', 'artificial color', 'blocklist', -18, 'No nutritional value, potential health risks'),
  ('f0000001-0000-0000-0000-000000000001', 'sugar', 'blocklist', -10, 'Unnecessary additive');

-- BARF Diet criteria
insert into public.criteria (framework_id, ingredient, rule, score_impact, reason) values
  ('f0000001-0000-0000-0000-000000000002', 'chicken breast', 'prefer', 30, 'Real whole meat — ideal for raw diet'),
  ('f0000001-0000-0000-0000-000000000002', 'beef', 'prefer', 30, 'Whole meat protein'),
  ('f0000001-0000-0000-0000-000000000002', 'bone meal', 'prefer', 25, 'Essential calcium for raw diet'),
  ('f0000001-0000-0000-0000-000000000002', 'organ meat', 'prefer', 28, 'Nutrient-dense, essential in raw feeding'),
  ('f0000001-0000-0000-0000-000000000002', 'sweet potato', 'blocklist', -10, 'Starch not ideal for raw diet philosophy'),
  ('f0000001-0000-0000-0000-000000000002', 'corn', 'blocklist', -35, 'Grain — completely unacceptable in raw diet'),
  ('f0000001-0000-0000-0000-000000000002', 'wheat', 'blocklist', -35, 'Grain — unacceptable'),
  ('f0000001-0000-0000-0000-000000000002', 'rice', 'blocklist', -20, 'Grain filler'),
  ('f0000001-0000-0000-0000-000000000002', 'BHA', 'blocklist', -50, 'Synthetic — completely unacceptable'),
  ('f0000001-0000-0000-0000-000000000002', 'BHT', 'blocklist', -50, 'Synthetic preservative'),
  ('f0000001-0000-0000-0000-000000000002', 'chicken by-product', 'blocklist', -30, 'Processed, not whole meat'),
  ('f0000001-0000-0000-0000-000000000002', 'tapioca', 'blocklist', -8, 'Unnecessary starch filler');

-- PetNutrition YT criteria
insert into public.criteria (framework_id, ingredient, rule, score_impact, reason) values
  ('f0000001-0000-0000-0000-000000000003', 'chicken breast', 'prefer', 20, 'Good protein source'),
  ('f0000001-0000-0000-0000-000000000003', 'chicken', 'prefer', 15, 'Acceptable protein'),
  ('f0000001-0000-0000-0000-000000000003', 'salmon oil', 'prefer', 15, 'Great for coat health'),
  ('f0000001-0000-0000-0000-000000000003', 'sweet potato', 'prefer', 10, 'Decent filler ingredient'),
  ('f0000001-0000-0000-0000-000000000003', 'pumpkin', 'prefer', 10, 'Good for digestion'),
  ('f0000001-0000-0000-0000-000000000003', 'BHA', 'blocklist', -35, 'Avoid synthetic preservatives'),
  ('f0000001-0000-0000-0000-000000000003', 'BHT', 'blocklist', -30, 'Synthetic preservative to avoid'),
  ('f0000001-0000-0000-0000-000000000003', 'propylene glycol', 'blocklist', -25, 'Chemical additive'),
  ('f0000001-0000-0000-0000-000000000003', 'artificial color', 'blocklist', -20, 'No reason to add color to pet food'),
  ('f0000001-0000-0000-0000-000000000003', 'corn', 'blocklist', -10, 'Low value filler'),
  ('f0000001-0000-0000-0000-000000000003', 'chicken by-product', 'blocklist', -15, 'Lower quality than whole meat');

-- Seed some common ingredients
insert into public.ingredients (name, aliases, category) values
  ('chicken breast', '{"닭가슴살", "pollo", "poulet"}', 'protein'),
  ('chicken', '{"닭고기", "pollo"}', 'protein'),
  ('beef', '{"소고기", "res"}', 'protein'),
  ('salmon', '{"연어", "salmón"}', 'protein'),
  ('salmon oil', '{"연어오일", "aceite de salmón"}', 'supplement'),
  ('sweet potato', '{"고구마", "camote"}', 'carbohydrate'),
  ('BHA', '{"butylated hydroxyanisole"}', 'preservative'),
  ('BHT', '{"butylated hydroxytoluene"}', 'preservative'),
  ('propylene glycol', '{"프로필렌글리콜"}', 'additive'),
  ('corn', '{"옥수수", "maíz"}', 'grain'),
  ('wheat', '{"밀", "trigo"}', 'grain'),
  ('rice', '{"쌀", "arroz"}', 'grain'),
  ('chicken by-product', '{"닭부산물"}', 'protein'),
  ('blueberry', '{"블루베리", "arándano"}', 'fruit'),
  ('pumpkin', '{"호박", "calabaza"}', 'vegetable'),
  ('bone meal', '{"골분"}', 'supplement'),
  ('tapioca', '{"타피오카"}', 'carbohydrate'),
  ('flaxseed', '{"아마씨", "linaza"}', 'supplement'),
  ('sugar', '{"설탕", "azúcar"}', 'additive'),
  ('artificial color', '{"인공색소", "colorante artificial"}', 'additive'),
  ('soy', '{"대두", "soja"}', 'grain'),
  ('ethoxyquin', '{"에톡시퀸"}', 'preservative'),
  ('meat by-product', '{"육부산물"}', 'protein'),
  ('organ meat', '{"내장육", "vísceras"}', 'protein');
