-- メールとパスワードでのログイン（next-auth）のため、パスワードのハッシュ（bcrypt）を持たせる。
-- 既存の行は空（NULL）のまま。空の人はログインできない（npm run user:set-password で設定する）
ALTER TABLE users ADD COLUMN password_hash varchar(100);
