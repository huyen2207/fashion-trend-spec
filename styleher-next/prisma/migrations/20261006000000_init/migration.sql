-- StyleHer 初期スキーマ（docs/db.md 付録A の DDL）
-- 34テーブル・インデックス・CHECK 制約・トリガー（updated_at の自動更新、変更履歴）

-- ===== 共通：文字列ID（英小文字・数字・_ のみ、30文字まで） =====
CREATE DOMAIN code_id AS varchar(30) CHECK (VALUE ~ '^[a-z0-9_]+$');

-- ===== 共通：updated_at を自動で更新する関数 =====
CREATE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===== 1. マスタ =====
CREATE TABLE scenes (
  id           code_id     PRIMARY KEY,
  name         varchar(30) NOT NULL UNIQUE,
  icon         varchar(20) NOT NULL
               CONSTRAINT ck_scenes_icon CHECK (icon IN ('briefcase', 'bag', 'heart', 'sparkle', 'plane', 'home')),
  sort_order   smallint    NOT NULL DEFAULT 0,
  is_published boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE ages (
  id           code_id     PRIMARY KEY,
  name         varchar(30) NOT NULL UNIQUE,
  sort_order   smallint    NOT NULL DEFAULT 0,
  is_published boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE tastes (
  id           code_id     PRIMARY KEY,
  name         varchar(30) NOT NULL UNIQUE,
  sort_order   smallint    NOT NULL DEFAULT 0,
  is_published boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE categories (
  id           code_id     PRIMARY KEY,
  name         varchar(30) NOT NULL UNIQUE,
  sort_order   smallint    NOT NULL DEFAULT 0,
  is_published boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE colors (
  id           code_id     PRIMARY KEY,
  name         varchar(30) NOT NULL UNIQUE,
  sort_order   smallint    NOT NULL DEFAULT 0,
  is_published boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE post_tags (
  id           code_id     PRIMARY KEY,
  name         varchar(30) NOT NULL UNIQUE,
  sort_order   smallint    NOT NULL DEFAULT 0,
  is_published boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE inquiry_types (
  id           code_id     PRIMARY KEY,
  name         varchar(50) NOT NULL UNIQUE,
  sort_order   smallint    NOT NULL DEFAULT 0,
  is_published boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- ===== 2. ショップ・アイテム =====
CREATE TABLE shops (
  id                  code_id      PRIMARY KEY,
  name                varchar(50)  NOT NULL UNIQUE,
  url                 varchar(500) NOT NULL,
  shop_type           varchar(30)  NOT NULL,
  search_url_template varchar(500)
                      CONSTRAINT ck_shops_search_url_template CHECK (search_url_template LIKE '%{q}%'),
  sort_order          integer      NOT NULL DEFAULT 0,
  is_published        boolean      NOT NULL DEFAULT true,
  created_at          timestamptz  NOT NULL DEFAULT now(),
  updated_at          timestamptz  NOT NULL DEFAULT now()
);

CREATE TABLE products (
  id                  code_id      PRIMARY KEY,
  name                varchar(100) NOT NULL,
  category_id         code_id      NOT NULL REFERENCES categories (id) ON DELETE RESTRICT,
  color_id            code_id      NOT NULL REFERENCES colors (id) ON DELETE RESTRICT,
  price               integer      NOT NULL CONSTRAINT ck_products_price CHECK (price >= 0),
  recommended_shop_id code_id      NOT NULL REFERENCES shops (id) ON DELETE RESTRICT,
  image               varchar(255) NOT NULL,
  search_keyword      varchar(100) NOT NULL,
  sort_order          integer      NOT NULL DEFAULT 0,
  is_published        boolean      NOT NULL DEFAULT true,
  created_at          timestamptz  NOT NULL DEFAULT now(),
  updated_at          timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX idx_products_sort_order ON products (sort_order);
CREATE INDEX idx_products_category_id_price ON products (category_id, price);
CREATE INDEX idx_products_color_id ON products (color_id);
CREATE INDEX idx_products_price ON products (price);
CREATE INDEX idx_products_recommended_shop_id ON products (recommended_shop_id);

CREATE TABLE product_links (
  product_id code_id       NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  shop_id    code_id       NOT NULL REFERENCES shops (id) ON DELETE RESTRICT,
  custom_url varchar(1000),
  created_at timestamptz   NOT NULL DEFAULT now(),
  updated_at timestamptz   NOT NULL DEFAULT now(),
  PRIMARY KEY (product_id, shop_id)
);
CREATE INDEX idx_product_links_shop_id ON product_links (shop_id);

-- おすすめのショップの購入リンクが必ずあること（アイテムと購入リンクは同じトランザクションで登録する）
ALTER TABLE products
  ADD CONSTRAINT fk_products_recommended_link
  FOREIGN KEY (id, recommended_shop_id) REFERENCES product_links (product_id, shop_id)
  DEFERRABLE INITIALLY DEFERRED;

-- ===== 3. トレンド =====
CREATE TABLE trends (
  id           code_id      PRIMARY KEY,
  name         varchar(50)  NOT NULL,
  subtitle     varchar(100) NOT NULL,
  image        varchar(255) NOT NULL,
  hot_score    smallint     NOT NULL CONSTRAINT ck_trends_hot_score CHECK (hot_score BETWEEN 0 AND 100),
  season       varchar(30)  NOT NULL,
  post_count   integer      NOT NULL DEFAULT 0 CONSTRAINT ck_trends_post_count CHECK (post_count >= 0),
  description  text         NOT NULL,
  sort_order   integer      NOT NULL DEFAULT 0,
  is_published boolean      NOT NULL DEFAULT true,
  created_at   timestamptz  NOT NULL DEFAULT now(),
  updated_at   timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX idx_trends_sort_order ON trends (sort_order);

CREATE TABLE trend_images (
  trend_id   code_id      NOT NULL REFERENCES trends (id) ON DELETE CASCADE,
  sort_order smallint     NOT NULL CONSTRAINT ck_trend_images_sort_order CHECK (sort_order >= 1),
  image      varchar(255) NOT NULL,
  PRIMARY KEY (trend_id, sort_order)
);

CREATE TABLE trend_points (
  trend_id   code_id      NOT NULL REFERENCES trends (id) ON DELETE CASCADE,
  sort_order smallint     NOT NULL CONSTRAINT ck_trend_points_sort_order CHECK (sort_order >= 1),
  body       varchar(200) NOT NULL,
  PRIMARY KEY (trend_id, sort_order)
);

CREATE TABLE trend_tips (
  trend_id   code_id      NOT NULL REFERENCES trends (id) ON DELETE CASCADE,
  sort_order smallint     NOT NULL CONSTRAINT ck_trend_tips_sort_order CHECK (sort_order >= 1),
  body       varchar(200) NOT NULL,
  PRIMARY KEY (trend_id, sort_order)
);

CREATE TABLE trend_ages (
  trend_id code_id NOT NULL REFERENCES trends (id) ON DELETE CASCADE,
  age_id   code_id NOT NULL REFERENCES ages (id) ON DELETE RESTRICT,
  PRIMARY KEY (trend_id, age_id)
);
CREATE INDEX idx_trend_ages_age_id ON trend_ages (age_id);

CREATE TABLE trend_tastes (
  trend_id code_id NOT NULL REFERENCES trends (id) ON DELETE CASCADE,
  taste_id code_id NOT NULL REFERENCES tastes (id) ON DELETE RESTRICT,
  PRIMARY KEY (trend_id, taste_id)
);
CREATE INDEX idx_trend_tastes_taste_id ON trend_tastes (taste_id);

CREATE TABLE trend_products (
  trend_id   code_id  NOT NULL REFERENCES trends (id) ON DELETE CASCADE,
  product_id code_id  NOT NULL REFERENCES products (id) ON DELETE RESTRICT,
  sort_order smallint NOT NULL DEFAULT 0,
  PRIMARY KEY (trend_id, product_id)
);
CREATE INDEX idx_trend_products_product_id ON trend_products (product_id);

-- ===== 4. コーデ =====
CREATE TABLE outfits (
  id           code_id      PRIMARY KEY,
  scene_id     code_id      NOT NULL REFERENCES scenes (id) ON DELETE RESTRICT,
  title        varchar(100) NOT NULL,
  image        varchar(255) NOT NULL,
  description  text         NOT NULL,
  sort_order   integer      NOT NULL DEFAULT 0,
  is_published boolean      NOT NULL DEFAULT true,
  created_at   timestamptz  NOT NULL DEFAULT now(),
  updated_at   timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX idx_outfits_scene_id_sort_order ON outfits (scene_id, sort_order);

CREATE TABLE outfit_products (
  outfit_id  code_id     NOT NULL REFERENCES outfits (id) ON DELETE CASCADE,
  product_id code_id     NOT NULL REFERENCES products (id) ON DELETE RESTRICT,
  role       varchar(10) NOT NULL CONSTRAINT ck_outfit_products_role CHECK (role IN ('main', 'item')),
  sort_order smallint    NOT NULL DEFAULT 0,
  PRIMARY KEY (outfit_id, product_id),
  -- main は 0、item は 1 から
  CONSTRAINT ck_outfit_products_sort_order CHECK ((role = 'main') = (sort_order = 0) AND sort_order >= 0)
);
CREATE INDEX idx_outfit_products_product_id ON outfit_products (product_id);
-- 写真の主役アイテム（main）は1コーデに1つまで
CREATE UNIQUE INDEX uq_outfit_products_main ON outfit_products (outfit_id) WHERE role = 'main';

CREATE TABLE outfit_tips (
  outfit_id  code_id      NOT NULL REFERENCES outfits (id) ON DELETE CASCADE,
  sort_order smallint     NOT NULL CONSTRAINT ck_outfit_tips_sort_order CHECK (sort_order >= 1),
  body       varchar(200) NOT NULL,
  PRIMARY KEY (outfit_id, sort_order)
);

CREATE TABLE outfit_ages (
  outfit_id code_id NOT NULL REFERENCES outfits (id) ON DELETE CASCADE,
  age_id    code_id NOT NULL REFERENCES ages (id) ON DELETE RESTRICT,
  PRIMARY KEY (outfit_id, age_id)
);
CREATE INDEX idx_outfit_ages_age_id ON outfit_ages (age_id);

CREATE TABLE outfit_tastes (
  outfit_id code_id NOT NULL REFERENCES outfits (id) ON DELETE CASCADE,
  taste_id  code_id NOT NULL REFERENCES tastes (id) ON DELETE RESTRICT,
  PRIMARY KEY (outfit_id, taste_id)
);
CREATE INDEX idx_outfit_tastes_taste_id ON outfit_tastes (taste_id);

-- ===== 5. コラム・トップページ =====
CREATE TABLE posts (
  id           code_id      PRIMARY KEY,
  title        varchar(100) NOT NULL,
  tag_id       code_id      NOT NULL REFERENCES post_tags (id) ON DELETE RESTRICT,
  published_on date         NOT NULL,
  image        varchar(255) NOT NULL,
  excerpt      varchar(200) NOT NULL,
  is_published boolean      NOT NULL DEFAULT true,
  created_at   timestamptz  NOT NULL DEFAULT now(),
  updated_at   timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX idx_posts_tag_id ON posts (tag_id);
CREATE INDEX idx_posts_published_on ON posts (published_on DESC);

CREATE TABLE post_paragraphs (
  post_id    code_id  NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
  sort_order smallint NOT NULL CONSTRAINT ck_post_paragraphs_sort_order CHECK (sort_order >= 1),
  body       text     NOT NULL,
  PRIMARY KEY (post_id, sort_order)
);

CREATE TABLE hero_slides (
  id             integer      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  image          varchar(255) NOT NULL,
  image_position varchar(30)  NOT NULL DEFAULT 'center 30%',
  title          varchar(100) NOT NULL,
  body           varchar(200) NOT NULL,
  sort_order     integer      NOT NULL DEFAULT 0,
  is_published   boolean      NOT NULL DEFAULT true,
  created_at     timestamptz  NOT NULL DEFAULT now(),
  updated_at     timestamptz  NOT NULL DEFAULT now()
);

CREATE TABLE community_images (
  id           integer      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  image        varchar(255) NOT NULL,
  sort_order   integer      NOT NULL DEFAULT 0,
  is_published boolean      NOT NULL DEFAULT true,
  created_at   timestamptz  NOT NULL DEFAULT now(),
  updated_at   timestamptz  NOT NULL DEFAULT now()
);

-- ===== 6. ユーザー（F-21 会員登録の実現時に使う） =====
CREATE TABLE users (
  id            uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  email         varchar(254) NOT NULL,
  role          varchar(10)  NOT NULL DEFAULT 'member' CONSTRAINT ck_users_role CHECK (role IN ('member', 'admin')),
  last_login_at timestamptz,
  created_at    timestamptz  NOT NULL DEFAULT now(),
  updated_at    timestamptz  NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_users_email ON users (lower(email));

CREATE TABLE favorites (
  id         bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  trend_id   code_id     REFERENCES trends (id) ON DELETE CASCADE,
  outfit_id  code_id     REFERENCES outfits (id) ON DELETE CASCADE,
  product_id code_id     REFERENCES products (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  -- trend_id / outfit_id / product_id のうち、ちょうど1つだけに値が入る
  CONSTRAINT ck_favorites_one_target CHECK (num_nonnulls(trend_id, outfit_id, product_id) = 1),
  CONSTRAINT uq_favorites_user_id_trend_id UNIQUE (user_id, trend_id),
  CONSTRAINT uq_favorites_user_id_outfit_id UNIQUE (user_id, outfit_id),
  CONSTRAINT uq_favorites_user_id_product_id UNIQUE (user_id, product_id)
);
CREATE INDEX idx_favorites_user_id_created_at ON favorites (user_id, created_at);
CREATE INDEX idx_favorites_trend_id ON favorites (trend_id);
CREATE INDEX idx_favorites_outfit_id ON favorites (outfit_id);
CREATE INDEX idx_favorites_product_id ON favorites (product_id);

CREATE TABLE recent_views (
  id         bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  trend_id   code_id     REFERENCES trends (id) ON DELETE CASCADE,
  outfit_id  code_id     REFERENCES outfits (id) ON DELETE CASCADE,
  product_id code_id     REFERENCES products (id) ON DELETE CASCADE,
  viewed_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ck_recent_views_one_target CHECK (num_nonnulls(trend_id, outfit_id, product_id) = 1),
  CONSTRAINT uq_recent_views_user_id_trend_id UNIQUE (user_id, trend_id),
  CONSTRAINT uq_recent_views_user_id_outfit_id UNIQUE (user_id, outfit_id),
  CONSTRAINT uq_recent_views_user_id_product_id UNIQUE (user_id, product_id)
);
CREATE INDEX idx_recent_views_user_id_viewed_at ON recent_views (user_id, viewed_at DESC);
CREATE INDEX idx_recent_views_trend_id ON recent_views (trend_id);
CREATE INDEX idx_recent_views_outfit_id ON recent_views (outfit_id);
CREATE INDEX idx_recent_views_product_id ON recent_views (product_id);

CREATE TABLE style_profiles (
  user_id    uuid        PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  age_id     code_id     NOT NULL REFERENCES ages (id) ON DELETE RESTRICT,
  scene_id   code_id     NOT NULL REFERENCES scenes (id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_style_profiles_age_id ON style_profiles (age_id);
CREATE INDEX idx_style_profiles_scene_id ON style_profiles (scene_id);

CREATE TABLE style_profile_tastes (
  user_id  uuid     NOT NULL REFERENCES style_profiles (user_id) ON DELETE CASCADE,
  priority smallint NOT NULL CONSTRAINT ck_style_profile_tastes_priority CHECK (priority IN (1, 2)),
  taste_id code_id  NOT NULL REFERENCES tastes (id) ON DELETE RESTRICT,
  PRIMARY KEY (user_id, priority),
  CONSTRAINT uq_style_profile_tastes_user_id_taste_id UNIQUE (user_id, taste_id)
);
CREATE INDEX idx_style_profile_tastes_taste_id ON style_profile_tastes (taste_id);

-- ===== 7. 受付（メールマガジン・お問い合わせ） =====
CREATE TABLE newsletter_subscriptions (
  id              bigint       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email           varchar(254) NOT NULL CONSTRAINT ck_newsletter_subscriptions_email CHECK (email ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$'),
  status          varchar(20)  NOT NULL DEFAULT 'pending'
                  CONSTRAINT ck_newsletter_subscriptions_status CHECK (status IN ('pending', 'active', 'unsubscribed')),
  confirmed_at    timestamptz,
  unsubscribed_at timestamptz,
  created_at      timestamptz  NOT NULL DEFAULT now(),
  updated_at      timestamptz  NOT NULL DEFAULT now(),
  -- 状態と日時の組み合わせが矛盾しないようにする
  CONSTRAINT ck_newsletter_subscriptions_dates CHECK (
    (status = 'pending'      AND confirmed_at IS NULL     AND unsubscribed_at IS NULL) OR
    (status = 'active'       AND confirmed_at IS NOT NULL AND unsubscribed_at IS NULL) OR
    (status = 'unsubscribed' AND unsubscribed_at IS NOT NULL)
  )
);
CREATE UNIQUE INDEX uq_newsletter_subscriptions_email ON newsletter_subscriptions (lower(email));

CREATE TABLE contact_inquiries (
  id              bigint       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id         uuid         REFERENCES users (id) ON DELETE SET NULL,
  name            varchar(50)  NOT NULL,
  email           varchar(254) NOT NULL CONSTRAINT ck_contact_inquiries_email CHECK (email ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$'),
  inquiry_type_id code_id      NOT NULL REFERENCES inquiry_types (id) ON DELETE RESTRICT,
  message         text         NOT NULL CONSTRAINT ck_contact_inquiries_message CHECK (char_length(message) BETWEEN 10 AND 1000),
  status          varchar(20)  NOT NULL DEFAULT 'new'
                  CONSTRAINT ck_contact_inquiries_status CHECK (status IN ('new', 'in_progress', 'closed')),
  created_at      timestamptz  NOT NULL DEFAULT now(),
  updated_at      timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX idx_contact_inquiries_status_created_at ON contact_inquiries (status, created_at DESC);
CREATE INDEX idx_contact_inquiries_user_id ON contact_inquiries (user_id);
CREATE INDEX idx_contact_inquiries_inquiry_type_id ON contact_inquiries (inquiry_type_id);

-- ===== 8. 運用（変更履歴） =====
CREATE TABLE audit_logs (
  id         bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    uuid        REFERENCES users (id) ON DELETE SET NULL,
  table_name varchar(63) NOT NULL,
  action     varchar(10) NOT NULL CONSTRAINT ck_audit_logs_action CHECK (action IN ('insert', 'update', 'delete')),
  old_data   jsonb,
  new_data   jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ck_audit_logs_data CHECK (
    (action = 'insert' AND old_data IS NULL     AND new_data IS NOT NULL) OR
    (action = 'update' AND old_data IS NOT NULL AND new_data IS NOT NULL) OR
    (action = 'delete' AND old_data IS NOT NULL AND new_data IS NULL)
  )
);
CREATE INDEX idx_audit_logs_table_name_created_at ON audit_logs (table_name, created_at DESC);
CREATE INDEX idx_audit_logs_user_id ON audit_logs (user_id);

-- 変更した人は、アプリが接続ごとに SET app.user_id = '<ユーザーID>' で渡す
CREATE FUNCTION write_audit_log() RETURNS trigger AS $$
BEGIN
  INSERT INTO audit_logs (user_id, table_name, action, old_data, new_data)
  VALUES (
    nullif(current_setting('app.user_id', true), '')::uuid,
    TG_TABLE_NAME,
    lower(TG_OP),
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) END
  );
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ===== トリガー =====
DO $$
DECLARE t text;
BEGIN
  -- updated_at を持つテーブルすべて
  FOR t IN
    SELECT table_name FROM information_schema.columns
    WHERE table_schema = 'public' AND column_name = 'updated_at'
  LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
      t, t
    );
  END LOOP;

  -- 変更履歴：運営者が管理するマスタ・コンテンツのテーブル（個人情報を含むテーブルは対象外）
  FOREACH t IN ARRAY ARRAY[
    'scenes', 'ages', 'tastes', 'categories', 'colors', 'post_tags', 'inquiry_types',
    'shops', 'products', 'product_links',
    'trends', 'trend_images', 'trend_points', 'trend_tips', 'trend_ages', 'trend_tastes', 'trend_products',
    'outfits', 'outfit_products', 'outfit_tips', 'outfit_ages', 'outfit_tastes',
    'posts', 'post_paragraphs', 'hero_slides', 'community_images'
  ]
  LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%s_audit AFTER INSERT OR UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION write_audit_log()',
      t, t
    );
  END LOOP;
END $$;
