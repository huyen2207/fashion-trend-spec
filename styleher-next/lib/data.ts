// ===== StyleHer サンプルデータ =====
// 画像: Unsplash（無料で利用可能）。差し替えるときは画像ID、または
// 自分の画像のパス（例: "/images/shirt.jpg"。public/ に置く）を `img` に入れてください。
// 購入リンク: 楽天市場 / Amazon の検索結果ページへ移動します（q が検索キーワード）。価格は参考価格です。
// 毎日の更新（F-15）は、このファイルのデータを書き換えて反映します。

export type Option = { id: string; name: string };
export type SceneIcon = "briefcase" | "bag" | "heart" | "sparkle" | "plane" | "home";
export type Scene = Option & { icon: SceneIcon };
export type ShopLink = { shop: string; url: string };
type RawProduct = { id: string; name: string; cat: string; color: string; price: number; shop: string; img: string; q: string };
export type Product = RawProduct & { links: ShopLink[]; url: string };
export type Trend = {
  id: string; name: string; sub: string; img: string; gallery: string[]; hot: number; season: string;
  ages: string[]; tastes: string[]; desc: string; points: string[]; tips: string[]; products: string[];
  // このトレンドのコーデ（詳細画面のルックブック。件数がカードの「◯件のコーデ」になる）
  outfits: string[];
};
export type Outfit = {
  id: string; scene: string; main?: string; title: string; img: string; items: string[];
  ages: string[]; tastes: string[]; desc: string; tips: string[];
};
export type Shop = { name: string; url: string; type: string };
export type Post = { id: string; title: string; tag: string; date: string; img: string; excerpt: string; body: string[] };
// title の "\n" は改行として表示する
export type HeroSlide = { img: string; pos?: string; title: string; text: string };

const rakuten = (q: string) => `https://search.rakuten.co.jp/search/mall/${encodeURIComponent(q)}/`;
const amazon = (q: string) => `https://www.amazon.co.jp/s?k=${encodeURIComponent(q)}`;

// シーン
export const scenes: Scene[] = [
  { id: "tsukin", name: "通勤", icon: "briefcase" },
  { id: "kyujitsu", name: "休日", icon: "bag" },
  { id: "date", name: "デート", icon: "heart" },
  { id: "oyobare", name: "お呼ばれ", icon: "sparkle" },
  { id: "ryoko", name: "旅行", icon: "plane" },
  { id: "ouchi", name: "おうち時間", icon: "home" },
];

// 年代・テイスト
export const ages: Option[] = [
  { id: "20s", name: "20代" },
  { id: "30s", name: "30代" },
  { id: "40s", name: "40代" },
];
export const tastes: Option[] = [
  { id: "kireime", name: "きれいめ" },
  { id: "casual", name: "カジュアル" },
  { id: "feminine", name: "フェミニン" },
  { id: "natural", name: "ナチュラル" },
  { id: "simple", name: "シンプル" },
];

export const categories: Option[] = [
  { id: "all", name: "すべて" },
  { id: "tops", name: "トップス" },
  { id: "outer", name: "アウター" },
  { id: "bottoms", name: "ボトムス" },
  { id: "onepiece", name: "ワンピース" },
  { id: "shoes", name: "シューズ" },
  { id: "bag", name: "バッグ" },
  { id: "acc", name: "アクセサリー" },
];

const rawProducts: RawProduct[] = [
  { id: "p01", name: "レギュラーカラー白シャツ", cat: "tops", color: "白", price: 3990, shop: "楽天市場", img: "1603252109303-2751441dd157", q: "白シャツ レディース" },
  { id: "p02", name: "ボウタイブラウス", cat: "tops", color: "白", price: 4990, shop: "Amazon", img: "1513097633097-329a3a64e0d4", q: "ボウタイブラウス レディース" },
  { id: "p03", name: "リブタートルネックニット", cat: "tops", color: "グレー", price: 3490, shop: "楽天市場", img: "1601379327928-bedfaf9da2d0", q: "リブ タートルネック ニット レディース" },
  { id: "p04", name: "ざっくりVネックカーディガン", cat: "tops", color: "ベージュ", price: 5990, shop: "Amazon", img: "1683315565563-f72590773805", q: "Vネック カーディガン ベージュ レディース" },
  { id: "p05", name: "ノースリーブトップス", cat: "tops", color: "黒", price: 2990, shop: "楽天市場", img: "1519554318711-aaf73ece6ff9", q: "ノースリーブ トップス 黒 レディース" },
  { id: "p06", name: "リネンシャツ", cat: "tops", color: "生成り", price: 4490, shop: "Amazon", img: "1713881676551-b16f22ce4719", q: "リネンシャツ レディース" },
  { id: "p07", name: "トレンチコート", cat: "outer", color: "ベージュ", price: 12900, shop: "楽天市場", img: "1722859031306-4c81e8d83957", q: "トレンチコート レディース ベージュ" },
  { id: "p08", name: "ロングチェスターコート", cat: "outer", color: "キャメル", price: 15900, shop: "Amazon", img: "1546859028-196808f21cd7", q: "チェスターコート キャメル レディース" },
  { id: "p09", name: "センタープレスワイドパンツ", cat: "bottoms", color: "ベージュ", price: 4990, shop: "楽天市場", img: "1632282005753-29f80ed13c93", q: "ワイドパンツ センタープレス レディース" },
  { id: "p10", name: "プリーツロングスカート", cat: "bottoms", color: "白", price: 5490, shop: "Amazon", img: "1762343041454-8f1fdd459811", q: "プリーツスカート ロング 白" },
  { id: "p11", name: "フレアミニスカート", cat: "bottoms", color: "黒", price: 3990, shop: "楽天市場", img: "1789110853398-539d78dd63bc", q: "フレアスカート 黒 レディース" },
  { id: "p12", name: "ストレートデニム", cat: "bottoms", color: "ブルー", price: 5990, shop: "Amazon", img: "1602293589930-45aad59ba3ab", q: "ストレートデニム レディース" },
  { id: "p13", name: "シャツワンピース", cat: "onepiece", color: "ベージュ", price: 6990, shop: "楽天市場", img: "1621390636143-e8847ef86809", q: "シャツワンピース ベージュ" },
  { id: "p14", name: "花柄キャミワンピース", cat: "onepiece", color: "花柄", price: 5990, shop: "Amazon", img: "1503408024948-0a3e1b2b519c", q: "花柄 キャミワンピース" },
  { id: "p15", name: "花柄ホルターネックワンピース", cat: "onepiece", color: "ピンク", price: 9900, shop: "楽天市場", img: "1499939667766-4afceb292d05", q: "ホルターネック ワンピース 花柄 ピンク" },
  { id: "p16", name: "ビットローファー", cat: "shoes", color: "ブラウン", price: 7990, shop: "Amazon", img: "1649503377051-e092f490c482", q: "ビットローファー レディース ブラウン" },
  { id: "p17", name: "ポインテッドショートブーツ", cat: "shoes", color: "ベージュ", price: 7990, shop: "楽天市場", img: "1621996659490-3275b4d0d951", q: "ポインテッドトゥ ショートブーツ ベージュ" },
  { id: "p18", name: "サイドジップショートブーツ", cat: "shoes", color: "ブラウン", price: 8990, shop: "Amazon", img: "1605733160314-4fc7dac4bb16", q: "ショートブーツ レディース ブラウン" },
  { id: "p19", name: "白スニーカー", cat: "shoes", color: "白", price: 6990, shop: "楽天市場", img: "1544441892-794166f1e3be", q: "白スニーカー レディース" },
  { id: "p20", name: "レザーハンドバッグ", cat: "bag", color: "黒", price: 12900, shop: "Amazon", img: "1614179689702-355944cd0918", q: "レザー ハンドバッグ 通勤 レディース" },
  { id: "p21", name: "キャンバストートバッグ", cat: "bag", color: "生成り", price: 2990, shop: "楽天市場", img: "1574365569389-a10d488ca3fb", q: "キャンバストート 生成り" },
  { id: "p22", name: "プリーツミニバッグ", cat: "bag", color: "黒", price: 4990, shop: "Amazon", img: "1761646237988-79635fce1841", q: "パーティーバッグ ミニ 黒" },
  { id: "p23", name: "ゴールドフープピアス", cat: "acc", color: "ゴールド", price: 2490, shop: "楽天市場", img: "1617038260897-41a1f14a8ca0", q: "フープピアス ゴールド" },
  { id: "p24", name: "華奢チェーンネックレス", cat: "acc", color: "ゴールド", price: 3490, shop: "Amazon", img: "1633810542706-90e5ff7557be", q: "華奢 ネックレス ゴールド" },
  { id: "p25", name: "パールブレスレット", cat: "acc", color: "白", price: 2990, shop: "楽天市場", img: "1704957205218-d436eac4c607", q: "パールブレスレット" },
  { id: "p26", name: "ポインテッドパンプス", cat: "shoes", color: "黒", price: 6990, shop: "楽天市場", img: "1559334417-1adb87b6e97f", q: "ポインテッドトゥ パンプス 黒 レディース" },
  { id: "p27", name: "ベージュパンプス", cat: "shoes", color: "ベージュ", price: 6990, shop: "Amazon", img: "1566041254940-fe7a3b50257e", q: "パンプス ベージュ レディース" },
  { id: "p28", name: "テーラードジャケット", cat: "outer", color: "黒", price: 9990, shop: "楽天市場", img: "1592343516109-362f7bd871aa", q: "テーラードジャケット 黒 レディース" },
  { id: "p29", name: "ロングニットカーディガン", cat: "tops", color: "グレー", price: 4990, shop: "Amazon", img: "1579206464424-7e43a81cadc1", q: "ロングカーディガン グレー レディース" },
  { id: "p30", name: "ベーシックTシャツ", cat: "tops", color: "黒", price: 1990, shop: "楽天市場", img: "1610502778270-c5c6f4c7d575", q: "Tシャツ 黒 無地 レディース" },
  { id: "p31", name: "レザーリュック", cat: "bag", color: "ブラウン", price: 9990, shop: "Amazon", img: "1622560480605-d83c853bc5c3", q: "レザー リュック ブラウン レディース" },
  { id: "p32", name: "ピンヒールショートブーツ", cat: "shoes", color: "黒", price: 9990, shop: "Amazon", img: "1605733513549-de9b150bd70d", q: "ショートブーツ ピンヒール 黒 レディース" },
  { id: "p33", name: "ポインテッドフラットシューズ", cat: "shoes", color: "黒", price: 3990, shop: "楽天市場", img: "1712512343634-f64161d3daa6", q: "フラットシューズ ポインテッド 黒 レディース" },
  { id: "p34", name: "クルーネックニット", cat: "tops", color: "ブラウン", price: 4490, shop: "楽天市場", img: "1607160199580-1b0c9b736b66", q: "クルーネック ニット テラコッタ レディース" },
  // 以下は、コーデの写真をそのままアイテムの写真にしている（写真の主役のアイテム）
  { id: "p35", name: "ノーカラーウールコート", cat: "outer", color: "生成り", price: 16900, shop: "楽天市場", img: "1641387103830-6ab162de6aad", q: "ノーカラーコート アイボリー レディース" },
  { id: "p36", name: "ニットベスト", cat: "tops", color: "ブラウン", price: 3990, shop: "Amazon", img: "1635853139281-d6b25117ee7c", q: "ニットベスト ブラウン レディース" },
  { id: "p37", name: "オフショルダーニット", cat: "tops", color: "白", price: 3990, shop: "楽天市場", img: "1768542920419-d4f9c631a1bf", q: "オフショルダー ニット アイボリー" },
  { id: "p38", name: "ワンショルダーワンピース", cat: "onepiece", color: "グリーン", price: 11900, shop: "楽天市場", img: "1666162201218-79e596c6f206", q: "ワンショルダー ワンピース グリーン お呼ばれ" },
  { id: "p39", name: "ハイネックロングワンピース", cat: "onepiece", color: "黒", price: 9990, shop: "Amazon", img: "1763906803298-90544fc67abd", q: "ロングワンピース 黒 ハイネック" },
  { id: "p40", name: "ドレープノースリーブトップス", cat: "tops", color: "ピンク", price: 4990, shop: "Amazon", img: "1759725415895-775562df4088", q: "ドレープ ノースリーブ トップス レディース" },
  { id: "p41", name: "大判ストール", cat: "acc", color: "ブラウン", price: 2990, shop: "楽天市場", img: "1544955380-68a72d66ad6b", q: "大判ストール テラコッタ" },
  { id: "p42", name: "ケーブルニットカーディガン", cat: "tops", color: "ピンク", price: 4990, shop: "Amazon", img: "1679802411227-9e1f5f7ad430", q: "ケーブルニット カーディガン ピンク" },
  { id: "p43", name: "くすみカラーのタートルネックニット", cat: "tops", color: "グリーン", price: 4490, shop: "楽天市場", img: "1625520109015-2ee42baffda6", q: "タートルネック ニット グリーン レディース" },
  { id: "p44", name: "ワッフル編みタートルネックニット", cat: "tops", color: "白", price: 3990, shop: "Amazon", img: "1542834240-c28a3c44dad1", q: "タートルネック ニット 白 レディース" },
  { id: "p45", name: "スプリングコート", cat: "outer", color: "ピンク", price: 8990, shop: "楽天市場", img: "1715353305010-cfef30dfe16a", q: "スプリングコート ピンク レディース" },
];

// 各アイテムに複数ショップの購入リンクを付ける（F-10 ショップ比較）
// 先頭が「購入する」ボタンのリンクになる
export const products: Product[] = rawProducts.map((p) => {
  const links = [
    { shop: "楽天市場", url: rakuten(p.q) },
    { shop: "Amazon", url: amazon(p.q) },
  ];
  links.sort((a, b) => (a.shop === p.shop ? -1 : b.shop === p.shop ? 1 : 0));
  return { ...p, links, url: links[0].url };
});

export const trends: Trend[] = [
  {
    id: "kireime",
    name: "きれいめカジュアル",
    sub: "上品で、ちゃんと見える",
    img: "1514813836041-518668f092b1",
    gallery: ["1681828304358-cccb7b98fe63", "1690149070684-9f8d9d378533", "1641387103830-6ab162de6aad"],
    hot: 95,
    season: "2026秋冬",
    ages: ["20s", "30s", "40s"],
    tastes: ["kireime", "simple"],
    desc: "カジュアルなのにきちんと感がある、日本の大人女性の定番スタイル。ベーシックカラーと上質な素材で、通勤にも休日にも使える着こなしです。",
    points: ["ベージュ・キャメル・ネイビーなどのベーシックカラー", "ロングコートやトレンチで縦長シルエット", "足元はローファーやパンプスで品よく"],
    tips: ["全身3色以内にまとめると、すっきり上品に", "デニムの日もシャツやローファーを合わせれば“きれいめ”に", "小物はゴールドの華奢アクセで、さりげなく"],
    products: ["p07", "p01", "p09", "p16"],
    outfits: ["o25", "o06", "o01", "o04", "o03", "o11"],
  },
  {
    id: "feminine",
    name: "大人フェミニン",
    sub: "やわらかく、女性らしく",
    img: "1503408024948-0a3e1b2b519c",
    gallery: ["1513097633097-329a3a64e0d4", "1768542920419-d4f9c631a1bf", "1499939667766-4afceb292d05"],
    hot: 87,
    season: "通年",
    ages: ["20s", "30s"],
    tastes: ["feminine"],
    desc: "甘すぎない、大人のための女性らしさ。とろみ素材や小花柄、ボウタイなどのディテールを一点取り入れるのがポイントです。",
    points: ["ボウタイブラウス、オフショルダーなどのディテール", "小花柄・プリーツで揺れ感をプラス", "くすみピンクやアイボリーのやさしい色"],
    tips: ["甘いアイテムは一つだけ。ほかはシンプルに", "プリーツスカートにはニットやシャツで大人っぽく", "パールアクセで上品さをひとさじ"],
    products: ["p02", "p10", "p14", "p25"],
    outfits: ["o10", "o11", "o09", "o12", "o13", "o16", "o19"],
  },
  {
    id: "office",
    name: "オフィスカジュアル",
    sub: "通勤服は、きちんとラクに",
    img: "1774205884993-86c63afbe871",
    gallery: ["1758600587839-56ba05596c69", "1758691737605-69a0e78bd193", "1762341103814-764cdbf959e4"],
    hot: 91,
    season: "通年",
    ages: ["20s", "30s", "40s"],
    tastes: ["kireime", "simple"],
    desc: "スーツほど堅くなく、でもきちんと見える通勤スタイル。動きやすさと清潔感を両立させるのが、今どきのオフィスカジュアルです。",
    points: ["白シャツ・タートルネックなど清潔感のあるトップス", "センタープレスのワイドパンツ", "A4が入るレザーバッグ"],
    tips: ["ジャケットを一枚置いておくと、急な会議にも安心", "パンツは黒・ベージュ・グレーの3本で着回し", "足元はローファーかローヒールのパンプスで疲れにくく"],
    products: ["p01", "p09", "p20", "p26"],
    outfits: ["o02", "o01", "o03", "o04"],
  },
  {
    id: "natural",
    name: "ナチュラル",
    sub: "リネンとアースカラーで自然体",
    img: "1768064722888-2136781a4150",
    gallery: ["1764298493197-a1c1cce57800", "1772442164696-7d65192147ea", "1768064903881-a20f34e8253b"],
    hot: 82,
    season: "2026春夏〜秋",
    ages: ["30s", "40s"],
    tastes: ["natural"],
    desc: "リネンやコットンなど天然素材を使った、ゆったりと自然体なスタイル。生成り・ベージュ・カーキなどのアースカラーでまとめます。",
    points: ["リネンシャツ、コットンのワンピース", "生成り・ベージュ・カーキのアースカラー", "ゆったりシルエットで抜け感を"],
    tips: ["ゆるい服同士でも、首・手首・足首を見せるとすっきり", "キャンバストートやかごバッグが好相性", "秋はニットカーディガンを重ねて"],
    products: ["p06", "p09", "p21", "p13"],
    outfits: ["o21", "o24", "o12", "o18", "o20", "o23"],
  },
  {
    id: "monotone",
    name: "モノトーンミニマル",
    sub: "白と黒で、洗練された印象",
    img: "1679802063062-e5d2bf591dbc",
    gallery: ["1542834240-c28a3c44dad1", "1735424080748-60103937729c", "1609325909281-aa677e4a8525"],
    hot: 84,
    season: "通年",
    ages: ["20s", "30s"],
    tastes: ["simple"],
    desc: "白・黒・グレーだけで組み立てる、シンプルで都会的なスタイル。アイテム数が少なくても着回しやすく、忙しい朝にもぴったりです。",
    points: ["白・黒・グレーの3色だけで構成", "装飾の少ないベーシックなデザイン", "素材感（ニット・レザー）で奥行きを"],
    tips: ["全身黒の日は、白スニーカーやピアスで軽さを", "ツヤのある素材を一点入れると地味に見えない", "シルエットにメリハリをつけて"],
    products: ["p05", "p11", "p03", "p19"],
    outfits: ["o02", "o06", "o22", "o15", "o21"],
  },
  {
    id: "brown",
    name: "秋のブラウンコーデ",
    sub: "今季の主役カラー",
    img: "1546859028-196808f21cd7",
    gallery: ["1544243747-b8ca15da2450", "1606534498512-1f073c93b9eb", "1617549765706-1c32193944ff"],
    hot: 93,
    season: "2026秋冬",
    ages: ["20s", "30s", "40s"],
    tastes: ["kireime", "casual"],
    desc: "キャメル、モカ、チョコレート。深みのあるブラウンが今季の主役です。ベージュや白と合わせれば、やさしく大人っぽい秋の装いに。",
    points: ["キャメルのロングコート", "テラコッタ・モカのニット", "ブラウンのローファーやブーツ"],
    tips: ["ブラウン×白で明るく、ブラウン×黒で引き締め", "濃淡のブラウンを重ねるワントーンコーデが今年らしい", "黄み肌さんはキャメル、青み肌さんはグレージュ寄りが似合う"],
    products: ["p08", "p04", "p16", "p18"],
    outfits: ["o25", "o05", "o07", "o18", "o04"],
  },
];

// main: 写真の主役アイテム（サムネイルには出さないが、着回し数に含める）
export const outfits: Outfit[] = [
  // 通勤
  { id: "o01", scene: "tsukin", title: "白シャツで清潔感のある通勤コーデ", img: "1758600587839-56ba05596c69", items: ["p01", "p09", "p16"], ages: ["20s", "30s", "40s"], tastes: ["kireime", "simple"], desc: "シンプルな白シャツは、どんな職場にもなじむ通勤服の基本。ベージュのワイドパンツとローファーを合わせれば、きちんと見えて一日ラクに過ごせます。", tips: ["第1ボタンを開けて、首まわりをすっきり見せる", "メガネの日はアクセサリーを控えめに"] },
  { id: "o02", scene: "tsukin", title: "オールブラックでかっこいい通勤コーデ", img: "1774205884993-86c63afbe871", items: ["p28", "p11", "p26"], ages: ["20s", "30s"], tastes: ["kireime", "simple"], desc: "黒のジャケットとミニスカートに、黒タイツとパンプスを合わせて全身を黒でまとめたスタイル。メガネを合わせると、知的でクールな印象に。", tips: ["黒タイツはうっすら透ける薄手を選ぶと重くならない", "全身黒の日は、メガネやリップで顔まわりにアクセントを"] },
  { id: "o03", scene: "tsukin", title: "タートルネックで知的な印象に", img: "1758691737605-69a0e78bd193", items: ["p03", "p09", "p16"], ages: ["30s", "40s"], tastes: ["simple", "kireime"], desc: "肌寒い日は、淡いグレーのタートルネック。メガネと合わせると、知的でやわらかい印象に。", tips: ["ローファーで一日中歩いても疲れにくい", "髪はまとめて首元をすっきり見せる"] },
  { id: "o04", scene: "tsukin", main: "p35", title: "アイボリーコートで大人の上品コーデ", img: "1641387103830-6ab162de6aad", items: ["p17"], ages: ["40s"], tastes: ["kireime"], desc: "チャイナボタンのアイボリーコートに、ブラウンのタイトスカートとベージュのショートブーツ。やさしい色でまとめた、40代の通勤にも休日にも似合う上品な装い。", tips: ["インナーとスカートはブラウン系にして、コートの白を引き立てる", "カチューシャで顔まわりをすっきり"] },
  // 休日
  { id: "o05", scene: "kyujitsu", main: "p36", title: "ニットベストで秋のレトロカジュアル", img: "1635853139281-d6b25117ee7c", items: ["p02", "p16"], ages: ["20s"], tastes: ["casual"], desc: "ブラウンのニットベストに、リボン付きの白ブラウスとチェックのプリーツスカート。黒のハイソックスとローファーで、紅葉の季節にぴったりのレトロな休日スタイル。", tips: ["ローファー×ハイソックスでクラシカルに", "ベストとローファーの色をそろえるとまとまる"] },
  { id: "o06", scene: "kyujitsu", title: "ロングカーデで大人の街歩き", img: "1527063652841-2920dd529e30", items: ["p29", "p01", "p33"], ages: ["20s", "30s"], tastes: ["casual", "simple"], desc: "白シャツに黒のスリムパンツ、グレーのロングカーディガンをさらっと羽織って。フラットシューズで、たくさん歩く日もラクなモノトーンスタイル。", tips: ["ロングカーデは前を開けて縦のラインを強調", "小さめのショルダーバッグで両手をあけて"] },
  { id: "o07", scene: "kyujitsu", title: "テラコッタのニットでリラックス休日", img: "1544243747-b8ca15da2450", items: ["p34"], ages: ["20s", "30s"], tastes: ["casual"], desc: "テラコッタカラーのリブニットは、秋の休日に取り入れやすいトレンドカラー。黒のパンツと合わせて、ほどよく引き締めます。", tips: ["ボトムは黒にして、ニットの色を主役に", "ニットの袖を少しまくると抜け感が出る"] },
  { id: "o08", scene: "kyujitsu", title: "Tシャツとワイドパンツでカフェ巡り", img: "1785053370880-1e74bf28c34f", items: ["p30", "p09"], ages: ["20s", "30s"], tastes: ["casual", "simple"], desc: "黒のTシャツにベージュ系のワイドパンツを合わせた、ラクで大人っぽいカジュアル。明るいカフェの窓辺にもなじみます。", tips: ["Tシャツは前だけタックインしてすっきり", "黒×ベージュの2色でまとめると大人っぽい"] },
  { id: "o25", scene: "kyujitsu", main: "p08", title: "キャメルコートで秋の週末", img: "1546859028-196808f21cd7", items: ["p32"], ages: ["20s", "30s", "40s"], tastes: ["kireime", "casual"], desc: "今季の主役カラー、キャメルのロングコート。ボルドーのタートルネックと黒のボトム、黒のショートブーツで、秋らしく引き締めます。", tips: ["インナーはボルドーで季節感を", "コートの前は開けて縦のラインを強調"] },
  // デート
  { id: "o09", scene: "date", main: "p37", title: "オフショルで甘めデート", img: "1768542920419-d4f9c631a1bf", items: ["p10", "p27"], ages: ["20s"], tastes: ["feminine"], desc: "アイボリーのオフショルダーニットで、やわらかくて女性らしい印象に。白のプリーツスカートとベージュのパンプスで、全身をやさしい色にまとめます。", tips: ["髪はゆるく巻いて", "肌見せは肩の一か所だけにすると上品"] },
  { id: "o10", main: "p14", scene: "date", title: "花柄ワンピースで休日デート", img: "1503408024948-0a3e1b2b519c", items: ["p04", "p27"], ages: ["20s", "30s"], tastes: ["feminine"], desc: "小花柄のキャミワンピースは、一枚でデートらしい華やかさが出ます。", tips: ["肌寒い日はカーディガンを肩掛けに", "髪はおろして、ワンピースのやわらかさに合わせる"] },
  { id: "o11", main: "p02", scene: "date", title: "白ブラウスで清楚な印象に", img: "1513097633097-329a3a64e0d4", items: ["p10", "p25", "p27"], ages: ["20s"], tastes: ["feminine", "kireime"], desc: "セーラーカラーのリボンブラウスに白のプリーツスカートを合わせて、清楚で好印象なスタイルに。", tips: ["パールアクセでさらに上品に", "リボンはゆるく結ぶと甘くなりすぎない"] },
  { id: "o12", main: "p13", scene: "date", title: "シャツワンピースで大人デート", img: "1621390636143-e8847ef86809", items: ["p16"], ages: ["30s", "40s"], tastes: ["feminine", "natural"], desc: "ベージュのショート丈シャツワンピースは、カジュアルすぎず頑張りすぎない大人のデート服。", tips: ["ウエストをリボンベルトでマークしてメリハリを", "小さめのショルダーバッグで軽やかに"] },
  // お呼ばれ
  { id: "o13", main: "p15", scene: "oyobare", title: "ホルターネックワンピースで華やかに", img: "1499939667766-4afceb292d05", items: ["p22", "p27"], ages: ["20s", "30s"], tastes: ["feminine"], desc: "くすみピンクにグレーの花柄が映える、ホルターネックのロングワンピース。揺れる裾で写真映えも◎。結婚式のお呼ばれにも安心です。", tips: ["白っぽく見える色は避けるのがマナー", "肩が出るデザインは、式の間はボレロやショールを羽織る"] },
  { id: "o14", main: "p38", scene: "oyobare", title: "グリーンのワンピースで上品に", img: "1666162201218-79e596c6f206", items: ["p22", "p27"], ages: ["30s", "40s"], tastes: ["kireime", "feminine"], desc: "深みのあるグリーンのワンショルダーワンピースは、30代・40代のお呼ばれにおすすめの華やかな色。ターコイズのロングネックレスで、顔まわりをさらに明るく。", tips: ["アクセサリーは大ぶりのものを一つだけにして主役に", "ドレスの色が強いので、バッグと靴は黒やベージュで落ち着かせる"] },
  { id: "o15", main: "p39", scene: "oyobare", title: "黒のロングワンピースをクラシカルに", img: "1763906803298-90544fc67abd", items: ["p22", "p26"], ages: ["30s", "40s"], tastes: ["kireime", "simple"], desc: "ハイネックの黒のロングワンピースに、光沢のあるグリーンのショールを肩掛けして華やかに。ヘッドアクセを合わせると、食事会や式典にも映えるクラシカルな装いに。", tips: ["黒一色のときは、ショールや小物で明るさをプラス", "髪はまとめてヘッドアクセを主役に"] },
  { id: "o16", main: "p40", scene: "oyobare", title: "ドレープトップスで大人のパーティー", img: "1759725415895-775562df4088", items: ["p11", "p22", "p26"], ages: ["20s", "30s"], tastes: ["feminine"], desc: "やわらかく落ちるドレープが上品な、モーブカラーのノースリーブトップス。髪をまとめて耳元のアクセを見せれば、二次会や女子会も華やかに。", tips: ["髪はまとめて耳元のアクセを主役に", "ボトムは黒にすると大人っぽくまとまる"] },
  // 旅行
  { id: "o17", main: "p45", scene: "ryoko", title: "桜並木をピンクのコートでおさんぽ", img: "1715353305010-cfef30dfe16a", items: [], ages: ["20s", "30s"], tastes: ["casual", "feminine"], desc: "やわらかなピンクのコートに黒のパンツを合わせて、春の桜並木を散策。小さめのバッグとカメラを持って、身軽に歩けるスタイルです。", tips: ["春の旅行は、脱ぎ着しやすい薄手のコートが便利", "ボトムを黒にすると、ピンクが甘くなりすぎない"] },
  { id: "o18", main: "p41", scene: "ryoko", title: "大判ストールで秋の水辺さんぽ", img: "1544955380-68a72d66ad6b", items: [], ages: ["20s", "30s"], tastes: ["casual", "natural"], desc: "テラコッタの大判ストールを、ふんわりしたニットカーディガンに巻いて。朝晩の寒暖差がある秋の旅行も、ストール1枚で温度調節できます。", tips: ["ストールはブランケット代わりにも", "カーディガンとインナーは淡い色にして、ストールを主役に"] },
  { id: "o19", main: "p42", scene: "ryoko", title: "湖畔でピンクカーディガン", img: "1679802411227-9e1f5f7ad430", items: [], ages: ["20s"], tastes: ["casual", "feminine"], desc: "白のタートルネックに、ピンクのケーブルニットカーディガンを重ねて。自然の中ではやさしいピンクがよく映え、旅行写真を明るい印象にしてくれます。", tips: ["ボトムは黒で引き締めると甘くなりすぎない", "荷物を減らすなら着回せる色を選んで"] },
  { id: "o20", scene: "ryoko", title: "紅葉狩りの動きやすいコーデ", img: "1737449149928-965d1258a518", items: ["p09", "p31", "p19"], ages: ["30s", "40s"], tastes: ["casual", "natural"], desc: "ネイビーのトップスにベージュのワイドパンツ、レザーのリュックを合わせて。階段や坂道の多い紅葉スポットも快適に歩けます。", tips: ["リュックで両手をあけて", "足元は歩きやすいスニーカーで"] },
  // おうち時間
  { id: "o21", scene: "ouchi", title: "リネンのセットアップでくつろぐ", img: "1768064722888-2136781a4150", items: ["p06", "p25"], ages: ["30s", "40s"], tastes: ["natural"], desc: "肌ざわりのいい白のリネンシャツとパンツで、おうちでも心地よく、きちんと感もキープ。", tips: ["宅配やご近所への外出もそのままOK", "ブレスレットを重ねると、ラフになりすぎない"] },
  { id: "o22", main: "p44", scene: "ouchi", title: "白ニットでぬくもりおうちコーデ", img: "1542834240-c28a3c44dad1", items: [], ages: ["20s", "30s"], tastes: ["simple"], desc: "ワッフル編みの白のタートルネックニットは、寒くなる季節のおうち時間の相棒。", tips: ["ニットは手洗い表示を確認してお手入れを", "袖が長めのニットは、手元まで包まれて暖かい"] },
  { id: "o23", main: "p43", scene: "kyujitsu", title: "くすみグリーンのニットで水辺さんぽ", img: "1625520109015-2ee42baffda6", items: [], ages: ["20s", "30s"], tastes: ["natural", "casual"], desc: "くすみグリーンのタートルネックニットは、ナチュラルで落ち着いた雰囲気。メガネと合わせると、やさしく知的な印象に。", tips: ["ニットは少し大きめを選んで、袖で手元を包む", "グリーンはベージュやブラウンと合わせるとなじむ"] },
  { id: "o24", scene: "ouchi", title: "白のリネンシャツをゆるっと", img: "1768064903881-a20f34e8253b", items: ["p06", "p25"], ages: ["30s", "40s"], tastes: ["natural", "simple"], desc: "ゆったりした白のリネンシャツとパンツに、赤のサスペンダーを差し色に。リラックスしながらも、おしゃれな雰囲気をキープできます。", tips: ["袖をまくって手首を見せるとすっきり", "白一色の日は、小物で一点だけ色を足す"] },
];

export const shops: Shop[] = [
  { name: "UNIQLO", url: "https://www.uniqlo.com/jp/ja/", type: "ベーシック" },
  { name: "GU", url: "https://www.gu-global.com/jp/ja/", type: "トレンドプチプラ" },
  { name: "ZOZOTOWN", url: "https://zozo.jp/", type: "ファッション通販" },
  { name: "Rakuten Fashion", url: "https://brandavenue.rakuten.co.jp/", type: "ブランド通販" },
  { name: "しまむら", url: "https://www.shop-shimamura.com/", type: "プチプラ" },
  { name: "UNITED ARROWS", url: "https://store.united-arrows.co.jp/", type: "セレクトショップ" },
  { name: "LUMINE", url: "https://www.lumine.ne.jp/", type: "ファッションビル" },
  { name: "楽天市場", url: "https://www.rakuten.co.jp/", type: "総合通販" },
  { name: "Amazon", url: "https://www.amazon.co.jp/fashion", type: "総合通販" },
];

export const posts: Post[] = [
  {
    id: "a01",
    title: "2026年秋冬トレンド6選｜今年はブラウンが主役",
    tag: "トレンド",
    date: "2026-09-18",
    img: "1724916351483-75e80b270517",
    excerpt: "きれいめカジュアルから秋のブラウンまで。この秋冬に押さえておきたいトレンドをまとめました。",
    body: ["今季は「上品さ」と「心地よさ」がキーワード。きれいめカジュアルやオフィスカジュアルなど、日常で着やすいスタイルが引き続き人気です。", "トレンドカラーはキャメル、モカ、チョコレートなどのブラウン系。ベージュや白と合わせればやさしく、黒と合わせれば引き締まった印象になります。", "新しく一着買うなら、キャメルのロングコートがおすすめ。シャツ×デニムの定番コーデも、羽織るだけで今年らしく仕上がります。"],
  },
  {
    id: "a02",
    title: "30代からの通勤服｜“きれいめ”を作る3つのルール",
    tag: "通勤",
    date: "2026-09-15",
    img: "1762341103814-764cdbf959e4",
    excerpt: "毎朝の服選びに迷わない。忙しい人のための、シンプルな通勤服のルール。",
    body: ["ルール1：色は3色まで。白・ベージュ・ネイビーなどのベーシックカラーを軸にすると、どれを組み合わせてもまとまります。", "ルール2：素材にこだわる。シワになりにくく、ツヤ感のある素材を選ぶだけで、プチプラでもきちんと見えます。", "ルール3：靴とバッグはきれいめに。服がカジュアルでも、ローファーやレザーバッグで全体の印象が整います。"],
  },
  {
    id: "a03",
    title: "着回し力抜群！秋のベーシックアイテム10選",
    tag: "着回し",
    date: "2026-09-10",
    img: "1603400521630-9f2de124b33b",
    excerpt: "少ない服でおしゃれに見せるには、まず“使える10着”から。",
    body: ["白シャツ、タートルネックニット、カーディガン、トレンチコート、ワイドパンツ、ストレートデニム、プリーツスカート、シャツワンピース、ローファー、レザーバッグ。", "この10アイテムはどれもベーシックな色とデザインなので、組み合わせ次第で30通り以上のコーデが作れます。", "トレンドアイテムは、この“土台”に一つずつ足していくのが失敗しないコツです。"],
  },
  {
    id: "a04",
    title: "秋雨の日もおしゃれに｜傘と足元の選び方",
    tag: "季節のコツ",
    date: "2026-09-05",
    img: "1540004972914-99cb3aa1712e",
    excerpt: "雨が続く季節も、コーデを楽しむためのちょっとした工夫。",
    body: ["透明のビニール傘は、どんなコーデにも合わせやすく、顔まわりを明るく見せてくれます。", "足元は撥水加工のローファーやショートブーツがおすすめ。雨の日専用の一足があると気持ちもラクになります。", "裾が濡れにくい、くるぶし丈のパンツやスカートを選ぶのもポイントです。"],
  },
];

export const community: string[] = [
  "1697731136759-c2963bf94075",
  "1697731133066-a1b450b31725",
  "1630203340413-22c831d699e7",
  "1650275203831-a15545da9e94",
  "1674654442933-b3ef49a8456f",
  "1526720433762-3508756eb910",
  "1772442164696-7d65192147ea",
  "1774803681512-c40efc627ef4",
];

export const heroSlides: HeroSlide[] = [
  { img: "1527063652841-2920dd529e30", pos: "center 35%", title: "おしゃれは、\nもっと簡単に。", text: "今日のトレンド、シーン別コーデ、人気ショップまで。忙しい毎日でも、わたしらしい着こなしが見つかる場所。" },
  { img: "1546859028-196808f21cd7", pos: "center 30%", title: "2026秋冬は\nブラウンが主役。", text: "キャメル、モカ、チョコレート。深みのあるブラウンで、今年らしい大人の秋コーデを。" },
  { img: "1681828304358-cccb7b98fe63", pos: "center 25%", title: "迷ったら、\nシーンで選ぶ。", text: "通勤、デート、お呼ばれ、旅行。シーンを選ぶだけで、今日のコーデが決まります。" },
];
