"use client";

import { Clock, Loader2, Mail, Send } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// お問い合わせフォーム
// 送信先（Formspree などのフォーム受付サービスのURL）を環境変数に設定すると実際に送信する。
// 設定していない場合はデモとして、入力チェックと完了表示だけを行う（どこにも送信しない）。
const ENDPOINT = process.env.NEXT_PUBLIC_CONTACT_ENDPOINT;

const TYPES = [
  { id: "content", name: "掲載内容について" },
  { id: "shop", name: "商品・ショップについて" },
  { id: "bug", name: "不具合のご報告" },
  { id: "business", name: "広告・取材・提携について" },
  { id: "other", name: "その他" },
];

const MESSAGE_MIN = 10;
const MESSAGE_MAX = 1000;

type Fields = { name: string; email: string; type: string; message: string };
type Errors = Partial<Record<keyof Fields, string>>;

const EMPTY: Fields = { name: "", email: "", type: "", message: "" };

function validate(f: Fields): Errors {
  const errors: Errors = {};
  if (!f.name.trim()) errors.name = "お名前を入力してください。";
  else if (f.name.trim().length > 50) errors.name = "お名前は50文字以内で入力してください。";
  if (!f.email.trim()) errors.email = "メールアドレスを入力してください。";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) errors.email = "メールアドレスの形式が正しくありません。";
  if (!f.type) errors.type = "お問い合わせの種類を選んでください。";
  const len = f.message.trim().length;
  if (len < MESSAGE_MIN) errors.message = `お問い合わせ内容を${MESSAGE_MIN}文字以上で入力してください。`;
  else if (len > MESSAGE_MAX) errors.message = `お問い合わせ内容は${MESSAGE_MAX}文字以内で入力してください。`;
  return errors;
}

function Field({ id, label, error, children, hint }: { id: string; label: string; error?: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={id}>
          {label}
          <span className="text-xs font-normal text-rose">必須</span>
        </Label>
        {hint}
      </div>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

// 送信完了：円と✓を線で描く
function CheckDraw() {
  const draw = (delay: number) => ({
    initial: { pathLength: 0 },
    animate: { pathLength: 1 },
    transition: { duration: 0.5, delay, ease: "easeOut" as const },
  });
  return (
    <svg viewBox="0 0 52 52" className="size-14 text-rose" aria-hidden="true">
      <motion.circle cx="26" cy="26" r="24" fill="none" stroke="currentColor" strokeWidth="2" {...draw(0)} />
      <motion.path d="M15 27l7 7 15-15" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" {...draw(0.4)} />
    </svg>
  );
}

export function ContactForm() {
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<Fields | null>(null);
  // スパム対策：人には見えない入力欄。ここに入力があれば送信しない
  const [trap, setTrap] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const set = (key: keyof Fields, value: string) => {
    setFields((f) => ({ ...f, [key]: value }));
    // 直したところからエラー表示を消す
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const found = validate(fields);
    setErrors(found);
    const first = (Object.keys(found) as (keyof Fields)[])[0];
    if (first) {
      formRef.current?.querySelector<HTMLElement>(`#contact-${first}`)?.focus();
      return;
    }
    if (trap) return;

    setSending(true);
    try {
      const body = { ...fields, type: TYPES.find((t) => t.id === fields.type)?.name ?? fields.type };
      if (ENDPOINT) {
        const res = await fetch(ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      } else {
        await new Promise((r) => setTimeout(r, 600));
      }
      setSent(fields);
      setFields(EMPTY);
    } catch {
      toast.error("送信できませんでした。時間をおいて、もう一度お試しください。");
    } finally {
      setSending(false);
    }
  };

  const invalid = (key: keyof Fields) =>
    errors[key] ? { "aria-invalid": true, "aria-describedby": `contact-${key}-error` } : {};
  const messageLength = fields.message.trim().length;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.8fr]">
      <div className="space-y-4">
        {[
          { icon: Clock, title: "返信の目安", text: "3営業日以内に、ご入力のメールアドレスへお返事します。" },
          { icon: Mail, title: "個人情報について", text: "お名前とメールアドレスは、お問い合わせへの返信にのみ使用します。" },
        ].map(({ icon: InfoIcon, title, text }) => (
          <Card key={title} className="flex-row items-start gap-3 p-4">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-rose">
              <InfoIcon className="size-4" />
            </span>
            <div>
              <p className="text-sm font-medium">{title}</p>
              <p className="text-xs leading-relaxed text-muted-foreground">{text}</p>
            </div>
          </Card>
        ))}
        <p className="text-xs text-muted-foreground">
          商品の価格・在庫・配送については、各ショップへ直接お問い合わせください。
        </p>
      </div>

      <Card className="py-0">
        <CardContent className="p-6 md:p-8">
          <AnimatePresence mode="wait" initial={false}>
            {sent ? (
              <motion.div
                key="sent"
                className="flex flex-col items-center gap-3 py-8 text-center"
                role="status"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                <CheckDraw />
                <h2 className="text-xl font-semibold">送信が完了しました</h2>
                <p className="text-sm text-muted-foreground">
                  {sent.name} 様、お問い合わせありがとうございます。
                  <br />
                  {sent.email} 宛てにお返事します。
                </p>
                {!ENDPOINT && <p className="text-xs text-muted-foreground">（デモ版のため、実際には送信されていません）</p>}
                <Button variant="outline" className="mt-2 rounded-full" onClick={() => setSent(null)}>
                  別のお問い合わせをする
                </Button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                ref={formRef}
                noValidate
                onSubmit={onSubmit}
                className="space-y-5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field id="contact-name" label="お名前" error={errors.name}>
                    <Input
                      id="contact-name"
                      autoComplete="name"
                      placeholder="例）山田 花子"
                      value={fields.name}
                      onChange={(e) => set("name", e.target.value)}
                      {...invalid("name")}
                    />
                  </Field>
                  <Field id="contact-email" label="メールアドレス" error={errors.email}>
                    <Input
                      id="contact-email"
                      type="email"
                      autoComplete="email"
                      placeholder="例）example@mail.com"
                      value={fields.email}
                      onChange={(e) => set("email", e.target.value)}
                      {...invalid("email")}
                    />
                  </Field>
                </div>

                <Field id="contact-type" label="お問い合わせの種類" error={errors.type}>
                  <Select value={fields.type} onValueChange={(v) => set("type", v)}>
                    <SelectTrigger id="contact-type" className="w-full" {...invalid("type")}>
                      <SelectValue placeholder="選んでください" />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPES.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field
                  id="contact-message"
                  label="お問い合わせ内容"
                  error={errors.message}
                  hint={
                    <span className={cn("text-xs tabular-nums", messageLength > MESSAGE_MAX ? "text-destructive" : "text-muted-foreground")}>
                      {messageLength} / {MESSAGE_MAX}
                    </span>
                  }
                >
                  <Textarea
                    id="contact-message"
                    rows={6}
                    placeholder="お問い合わせ内容をご記入ください（10文字以上）"
                    value={fields.message}
                    onChange={(e) => set("message", e.target.value)}
                    {...invalid("message")}
                  />
                </Field>

                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="hidden"
                  value={trap}
                  onChange={(e) => setTrap(e.target.value)}
                />

                <Button type="submit" size="lg" className="w-full rounded-full sm:w-auto" disabled={sending}>
                  {sending ? <Loader2 className="animate-spin" /> : <Send />}
                  {sending ? "送信中…" : "送信する"}
                </Button>
              </motion.form>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
