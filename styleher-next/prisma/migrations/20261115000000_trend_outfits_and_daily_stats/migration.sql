-- トレンドの「注目度」と「コーデ件数」を、運営者が入れた固定の数字ではなく実際のデータから出す（docs/db.md 7.1）。
--   trend_outfits      … トレンドのコーデ（詳細画面のルックブック）。カードの「◯件のコーデ」もここから数える
--   trend_daily_stats  … トレンドの詳細を開いた回数・お気に入りにした回数を日ごと（日本時間）に数える。注目度の計算に使う
--   trends.post_count  … 使わなくなるので消す

-- ===== トレンドのコーデ =====
CREATE TABLE trend_outfits (
  trend_id   code_id  NOT NULL REFERENCES trends (id) ON DELETE CASCADE,
  outfit_id  code_id  NOT NULL REFERENCES outfits (id) ON DELETE RESTRICT,
  sort_order smallint NOT NULL DEFAULT 0,
  PRIMARY KEY (trend_id, outfit_id)
);
CREATE INDEX idx_trend_outfits_outfit_id ON trend_outfits (outfit_id);
CREATE TRIGGER trg_trend_outfits_audit AFTER INSERT OR UPDATE OR DELETE ON trend_outfits FOR EACH ROW EXECUTE FUNCTION write_audit_log();

-- 登録済みのコーデをトレンドに振り分ける（lib/data.ts の trends[].outfits と同じ）。トレンドかコーデがなければ入れない
INSERT INTO trend_outfits (trend_id, outfit_id, sort_order)
SELECT v.trend_id, v.outfit_id, v.sort_order
FROM (VALUES
  ('kireime', 'o25', 1), ('kireime', 'o06', 2), ('kireime', 'o01', 3), ('kireime', 'o04', 4), ('kireime', 'o03', 5), ('kireime', 'o11', 6),
  ('feminine', 'o10', 1), ('feminine', 'o11', 2), ('feminine', 'o09', 3), ('feminine', 'o12', 4), ('feminine', 'o13', 5), ('feminine', 'o16', 6), ('feminine', 'o19', 7),
  ('office', 'o02', 1), ('office', 'o01', 2), ('office', 'o03', 3), ('office', 'o04', 4),
  ('natural', 'o21', 1), ('natural', 'o24', 2), ('natural', 'o12', 3), ('natural', 'o18', 4), ('natural', 'o20', 5), ('natural', 'o23', 6),
  ('monotone', 'o08', 1), ('monotone', 'o22', 2), ('monotone', 'o15', 3), ('monotone', 'o02', 4), ('monotone', 'o06', 5),
  ('brown', 'o25', 1), ('brown', 'o05', 2), ('brown', 'o07', 3), ('brown', 'o18', 4), ('brown', 'o04', 5)
) AS v (trend_id, outfit_id, sort_order)
JOIN trends t ON t.id = v.trend_id
JOIN outfits o ON o.id = v.outfit_id;

-- ===== トレンドの日ごとの反応 =====
-- お気に入りは外したときに 1 引くので、日によってはマイナスになることがある
CREATE TABLE trend_daily_stats (
  trend_id       code_id NOT NULL REFERENCES trends (id) ON DELETE CASCADE,
  stat_date      date    NOT NULL,
  view_count     integer NOT NULL DEFAULT 0 CONSTRAINT ck_trend_daily_stats_view_count CHECK (view_count >= 0),
  favorite_count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (trend_id, stat_date)
);
CREATE INDEX idx_trend_daily_stats_stat_date ON trend_daily_stats (stat_date);

-- ===== 表示用のコーデ件数は、trend_outfits から数えるので消す =====
ALTER TABLE trends DROP COLUMN post_count;
