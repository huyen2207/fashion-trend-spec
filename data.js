// ===== StyleHer サンプルデータ =====
// 画像: Unsplash（無料で利用可能）。差し替えるときは画像ID、または
// 自分の画像のパス（例: "images/shirt.jpg"）を `img` に入れてください。
// 購入リンク: 楽天市場 / Amazon の検索結果ページへ移動します。価格は参考価格です。

const STYLEHER_DATA = (() => {
  const rakuten = (q) => `https://search.rakuten.co.jp/search/mall/${encodeURIComponent(q)}/`;
  const amazon = (q) => `https://www.amazon.co.jp/s?k=${encodeURIComponent(q)}`;

  // シーン
  const scenes = [
    { id: "tsukin", name: "通勤", icon: "briefcase" },
    { id: "kyujitsu", name: "休日", icon: "bag" },
    { id: "date", name: "デート", icon: "heart" },
    { id: "oyobare", name: "お呼ばれ", icon: "sparkle" },
    { id: "ryoko", name: "旅行", icon: "plane" },
    { id: "ouchi", name: "おうち時間", icon: "home" },
  ];

  // 年代・テイスト
  const ages = [
    { id: "20s", name: "20代" },
    { id: "30s", name: "30代" },
    { id: "40s", name: "40代" },
  ];
  const tastes = [
    { id: "kireime", name: "きれいめ" },
    { id: "casual", name: "カジュアル" },
    { id: "feminine", name: "フェミニン" },
    { id: "natural", name: "ナチュラル" },
    { id: "simple", name: "シンプル" },
  ];

  const categories = [
    { id: "all", name: "すべて" },
    { id: "tops", name: "トップス" },
    { id: "outer", name: "アウター" },
    { id: "bottoms", name: "ボトムス" },
    { id: "onepiece", name: "ワンピース" },
    { id: "shoes", name: "シューズ" },
    { id: "bag", name: "バッグ" },
    { id: "acc", name: "アクセサリー" },
  ];

  const products = [
    { id: "p01", name: "レギュラーカラー白シャツ", cat: "tops", color: "白", price: 3990, shop: "楽天市場", img: "1603252109303-2751441dd157", url: rakuten("白シャツ レディース") },
    { id: "p02", name: "ボウタイブラウス", cat: "tops", color: "白", price: 4990, shop: "Amazon", img: "1513097633097-329a3a64e0d4", url: amazon("ボウタイブラウス レディース") },
    { id: "p03", name: "リブタートルネックニット", cat: "tops", color: "グレー", price: 3490, shop: "楽天市場", img: "1601379327928-bedfaf9da2d0", url: rakuten("リブ タートルネック ニット レディース") },
    { id: "p04", name: "ざっくりVネックカーディガン", cat: "tops", color: "ベージュ", price: 5990, shop: "Amazon", img: "1683315565563-f72590773805", url: amazon("Vネック カーディガン ベージュ レディース") },
    { id: "p05", name: "ノースリーブトップス", cat: "tops", color: "黒", price: 2990, shop: "楽天市場", img: "1519554318711-aaf73ece6ff9", url: rakuten("ノースリーブ トップス 黒 レディース") },
    { id: "p06", name: "リネンシャツ", cat: "tops", color: "生成り", price: 4490, shop: "Amazon", img: "1713881676551-b16f22ce4719", url: amazon("リネンシャツ レディース") },
    { id: "p07", name: "トレンチコート", cat: "outer", color: "ベージュ", price: 12900, shop: "楽天市場", img: "1722859031306-4c81e8d83957", url: rakuten("トレンチコート レディース ベージュ") },
    { id: "p08", name: "ロングチェスターコート", cat: "outer", color: "キャメル", price: 15900, shop: "Amazon", img: "1635521248661-97f832387a70", url: amazon("チェスターコート キャメル レディース") },
    { id: "p09", name: "センタープレスワイドパンツ", cat: "bottoms", color: "ベージュ", price: 4990, shop: "楽天市場", img: "1632282005753-29f80ed13c93", url: rakuten("ワイドパンツ センタープレス レディース") },
    { id: "p10", name: "プリーツロングスカート", cat: "bottoms", color: "白", price: 5490, shop: "Amazon", img: "1762343041454-8f1fdd459811", url: amazon("プリーツスカート ロング 白") },
    { id: "p11", name: "フレアミニスカート", cat: "bottoms", color: "黒", price: 3990, shop: "楽天市場", img: "1789110853398-539d78dd63bc", url: rakuten("フレアスカート 黒 レディース") },
    { id: "p12", name: "ストレートデニム", cat: "bottoms", color: "ブルー", price: 5990, shop: "Amazon", img: "1602293589930-45aad59ba3ab", url: amazon("ストレートデニム レディース") },
    { id: "p13", name: "シャツワンピース", cat: "onepiece", color: "ベージュ", price: 6990, shop: "楽天市場", img: "1621390636143-e8847ef86809", url: rakuten("シャツワンピース ベージュ") },
    { id: "p14", name: "花柄キャミワンピース", cat: "onepiece", color: "花柄", price: 5990, shop: "Amazon", img: "1503408024948-0a3e1b2b519c", url: amazon("花柄 キャミワンピース") },
    { id: "p15", name: "お呼ばれドレープワンピース", cat: "onepiece", color: "ピンク", price: 9900, shop: "楽天市場", img: "1499939667766-4afceb292d05", url: rakuten("結婚式 お呼ばれ ワンピース ピンク") },
    { id: "p16", name: "ビットローファー", cat: "shoes", color: "ブラウン", price: 7990, shop: "Amazon", img: "1649503377051-e092f490c482", url: amazon("ビットローファー レディース ブラウン") },
    { id: "p17", name: "ポインテッドパンプス", cat: "shoes", color: "ベージュ", price: 5990, shop: "楽天市場", img: "1621996659490-3275b4d0d951", url: rakuten("ポインテッドトゥ パンプス ベージュ") },
    { id: "p18", name: "サイドジップショートブーツ", cat: "shoes", color: "ブラウン", price: 8990, shop: "Amazon", img: "1605733160314-4fc7dac4bb16", url: amazon("ショートブーツ レディース ブラウン") },
    { id: "p19", name: "白スニーカー", cat: "shoes", color: "白", price: 6990, shop: "楽天市場", img: "1544441892-794166f1e3be", url: rakuten("白スニーカー レディース") },
    { id: "p20", name: "レザーハンドバッグ", cat: "bag", color: "黒", price: 12900, shop: "Amazon", img: "1614179689702-355944cd0918", url: amazon("レザー ハンドバッグ 通勤 レディース") },
    { id: "p21", name: "キャンバストートバッグ", cat: "bag", color: "生成り", price: 2990, shop: "楽天市場", img: "1574365569389-a10d488ca3fb", url: rakuten("キャンバストート 生成り") },
    { id: "p22", name: "プリーツミニバッグ", cat: "bag", color: "黒", price: 4990, shop: "Amazon", img: "1761646237988-79635fce1841", url: amazon("パーティーバッグ ミニ 黒") },
    { id: "p23", name: "ゴールドフープピアス", cat: "acc", color: "ゴールド", price: 2490, shop: "楽天市場", img: "1617038260897-41a1f14a8ca0", url: rakuten("フープピアス ゴールド") },
    { id: "p24", name: "華奢チェーンネックレス", cat: "acc", color: "ゴールド", price: 3490, shop: "Amazon", img: "1633810542706-90e5ff7557be", url: amazon("華奢 ネックレス ゴールド") },
    { id: "p25", name: "パールブレスレット", cat: "acc", color: "白", price: 2990, shop: "楽天市場", img: "1704957205218-d436eac4c607", url: rakuten("パールブレスレット") },
  ];

  const trends = [
    {
      id: "kireime",
      name: "きれいめカジュアル",
      sub: "上品で、ちゃんと見える",
      img: "1514813836041-518668f092b1",
      gallery: ["1681828304358-cccb7b98fe63", "1690149070684-9f8d9d378533", "1621390636143-e8847ef86809"],
      hot: 95,
      season: "2026秋冬",
      posts: 128,
      ages: ["20s", "30s", "40s"],
      tastes: ["kireime", "simple"],
      desc: "カジュアルなのにきちんと感がある、日本の大人女性の定番スタイル。ベーシックカラーと上質な素材で、通勤にも休日にも使える着こなしです。",
      points: ["ベージュ・キャメル・ネイビーなどのベーシックカラー", "ロングコートやトレンチで縦長シルエット", "足元はローファーやパンプスで品よく"],
      tips: ["全身3色以内にまとめると、すっきり上品に", "デニムの日もシャツやローファーを合わせれば“きれいめ”に", "小物はゴールドの華奢アクセで、さりげなく"],
      products: ["p07", "p01", "p09", "p16"],
    },
    {
      id: "feminine",
      name: "大人フェミニン",
      sub: "やわらかく、女性らしく",
      img: "1503408024948-0a3e1b2b519c",
      gallery: ["1513097633097-329a3a64e0d4", "1768542920419-d4f9c631a1bf", "1499939667766-4afceb292d05"],
      hot: 87,
      season: "通年",
      posts: 96,
      ages: ["20s", "30s"],
      tastes: ["feminine"],
      desc: "甘すぎない、大人のための女性らしさ。とろみ素材や小花柄、ボウタイなどのディテールを一点取り入れるのがポイントです。",
      points: ["ボウタイブラウス、オフショルダーなどのディテール", "小花柄・プリーツで揺れ感をプラス", "くすみピンクやアイボリーのやさしい色"],
      tips: ["甘いアイテムは一つだけ。ほかはシンプルに", "プリーツスカートにはニットやシャツで大人っぽく", "パールアクセで上品さをひとさじ"],
      products: ["p02", "p10", "p14", "p25"],
    },
    {
      id: "office",
      name: "オフィスカジュアル",
      sub: "通勤服は、きちんとラクに",
      img: "1774205884993-86c63afbe871",
      gallery: ["1758600587839-56ba05596c69", "1758691737605-69a0e78bd193", "1762341103814-764cdbf959e4"],
      hot: 91,
      season: "通年",
      posts: 142,
      ages: ["20s", "30s", "40s"],
      tastes: ["kireime", "simple"],
      desc: "スーツほど堅くなく、でもきちんと見える通勤スタイル。動きやすさと清潔感を両立させるのが、今どきのオフィスカジュアルです。",
      points: ["白シャツ・タートルネックなど清潔感のあるトップス", "センタープレスのワイドパンツ", "A4が入るレザーバッグ"],
      tips: ["ジャケットを一枚置いておくと、急な会議にも安心", "パンツは黒・ベージュ・グレーの3本で着回し", "足元はローファーかローヒールのパンプスで疲れにくく"],
      products: ["p01", "p09", "p20", "p17"],
    },
    {
      id: "natural",
      name: "ナチュラル",
      sub: "リネンとアースカラーで自然体",
      img: "1768064722888-2136781a4150",
      gallery: ["1764298493197-a1c1cce57800", "1772442164696-7d65192147ea", "1768064903881-a20f34e8253b"],
      hot: 82,
      season: "2026春夏〜秋",
      posts: 74,
      ages: ["30s", "40s"],
      tastes: ["natural"],
      desc: "リネンやコットンなど天然素材を使った、ゆったりと自然体なスタイル。生成り・ベージュ・カーキなどのアースカラーでまとめます。",
      points: ["リネンシャツ、コットンのワンピース", "生成り・ベージュ・カーキのアースカラー", "ゆったりシルエットで抜け感を"],
      tips: ["ゆるい服同士でも、首・手首・足首を見せるとすっきり", "キャンバストートやかごバッグが好相性", "秋はニットカーディガンを重ねて"],
      products: ["p06", "p09", "p21", "p13"],
    },
    {
      id: "monotone",
      name: "モノトーンミニマル",
      sub: "白と黒で、洗練された印象",
      img: "1574108233203-71391be8f301",
      gallery: ["1542834240-c28a3c44dad1", "1735424080748-60103937729c", "1785053370880-1e74bf28c34f"],
      hot: 84,
      season: "通年",
      posts: 88,
      ages: ["20s", "30s"],
      tastes: ["simple"],
      desc: "白・黒・グレーだけで組み立てる、シンプルで都会的なスタイル。アイテム数が少なくても着回しやすく、忙しい朝にもぴったりです。",
      points: ["白・黒・グレーの3色だけで構成", "装飾の少ないベーシックなデザイン", "素材感（ニット・レザー）で奥行きを"],
      tips: ["全身黒の日は、白スニーカーやピアスで軽さを", "ツヤのある素材を一点入れると地味に見えない", "シルエットにメリハリをつけて"],
      products: ["p05", "p11", "p03", "p19"],
    },
    {
      id: "brown",
      name: "秋のブラウンコーデ",
      sub: "今季の主役カラー",
      img: "1546859028-196808f21cd7",
      gallery: ["1544243747-b8ca15da2450", "1606534498512-1f073c93b9eb", "1617549765706-1c32193944ff"],
      hot: 93,
      season: "2026秋冬",
      posts: 110,
      ages: ["20s", "30s", "40s"],
      tastes: ["kireime", "casual"],
      desc: "キャメル、モカ、チョコレート。深みのあるブラウンが今季の主役です。ベージュや白と合わせれば、やさしく大人っぽい秋の装いに。",
      points: ["キャメルのロングコート", "テラコッタ・モカのニット", "ブラウンのローファーやブーツ"],
      tips: ["ブラウン×白で明るく、ブラウン×黒で引き締め", "濃淡のブラウンを重ねるワントーンコーデが今年らしい", "黄み肌さんはキャメル、青み肌さんはグレージュ寄りが似合う"],
      products: ["p08", "p04", "p16", "p18"],
    },
  ];

  const outfits = [
    // 通勤
    { id: "o01", scene: "tsukin", title: "白シャツで清潔感のある通勤コーデ", img: "1758600587839-56ba05596c69", items: ["p01", "p09", "p17"], ages: ["20s", "30s", "40s"], tastes: ["kireime", "simple"], desc: "白シャツとベージュのワイドパンツは、どんな職場にもなじむ鉄板の組み合わせ。", tips: ["シャツはタックインして脚長に", "ネックレスで顔まわりを明るく"] },
    { id: "o02", scene: "tsukin", title: "ジャケットで引き締めるオフィスコーデ", img: "1774205884993-86c63afbe871", items: ["p02", "p20", "p17"], ages: ["20s", "30s"], tastes: ["kireime"], desc: "黒ジャケットにボウタイブラウスを合わせて、会議やプレゼンの日もきちんと。", tips: ["ブラウスの白で重くなりすぎない", "バッグはA4サイズが入るものを"] },
    { id: "o03", scene: "tsukin", title: "タートルネックで知的な印象に", img: "1758691737605-69a0e78bd193", items: ["p03", "p09", "p16"], ages: ["30s", "40s"], tastes: ["simple", "kireime"], desc: "肌寒い日はタートルネック。メガネと合わせると、知的でやわらかい印象に。", tips: ["ローファーで一日中歩いても疲れにくい"] },
    { id: "o04", scene: "tsukin", title: "ベージュコートで大人の通勤", img: "1641387103830-6ab162de6aad", items: ["p07", "p20", "p18"], ages: ["40s"], tastes: ["kireime"], desc: "明るいベージュのコートは顔色をよく見せ、40代の通勤服にぴったり。", tips: ["インナーは同系色でまとめて上品に"] },
    // 休日
    { id: "o05", scene: "kyujitsu", title: "秋のレトロカジュアル", img: "1635853139281-d6b25117ee7c", items: ["p04", "p11", "p16"], ages: ["20s"], tastes: ["casual"], desc: "ブラウンのベストとチェックスカートで、紅葉の季節にぴったりのレトロな休日スタイル。", tips: ["ローファー×ソックスでこなれ感を"] },
    { id: "o06", scene: "kyujitsu", title: "グレーコートで街歩き", img: "1527063652841-2920dd529e30", items: ["p01", "p12", "p19"], ages: ["20s", "30s"], tastes: ["casual", "simple"], desc: "ロングコートを羽織るだけで、シャツ×デニムの定番コーデも一気に大人っぽく。", tips: ["コートは前を開けて縦ラインを強調"] },
    { id: "o07", scene: "kyujitsu", title: "ざっくりニットでリラックス休日", img: "1544243747-b8ca15da2450", items: ["p04", "p12", "p18"], ages: ["20s", "30s"], tastes: ["casual"], desc: "テラコッタカラーのニットは、秋の休日に取り入れやすいトレンドカラー。", tips: ["ボトムはデニムで気取らずに"] },
    { id: "o08", scene: "kyujitsu", title: "カフェ巡りのシンプルコーデ", img: "1785053370880-1e74bf28c34f", items: ["p05", "p09", "p21"], ages: ["20s", "30s"], tastes: ["casual", "simple"], desc: "黒トップスとワイドパンツ、トートバッグで身軽にカフェ巡り。", tips: ["トートは生成りで抜け感を"] },
    // デート
    { id: "o09", scene: "date", title: "オフショルで甘めデート", img: "1768542920419-d4f9c631a1bf", items: ["p02", "p10", "p17"], ages: ["20s"], tastes: ["feminine"], desc: "アイボリーのオフショルダーで、やわらかくて女性らしい印象に。", tips: ["髪はゆるく巻いて", "肌見せは一か所だけにすると上品"] },
    { id: "o10", scene: "date", title: "花柄ワンピースで休日デート", img: "1503408024948-0a3e1b2b519c", items: ["p04", "p17", "p23"], ages: ["20s", "30s"], tastes: ["feminine"], desc: "小花柄のキャミワンピースは、一枚でデートらしい華やかさが出ます。", tips: ["肌寒い日はカーディガンを肩掛けに"] },
    { id: "o11", scene: "date", title: "白ブラウスで清楚な印象に", img: "1513097633097-329a3a64e0d4", items: ["p10", "p25", "p17"], ages: ["20s"], tastes: ["feminine", "kireime"], desc: "リボン付きの白ブラウスとプリーツスカートで、清楚で好印象なスタイル。", tips: ["パールアクセでさらに上品に"] },
    { id: "o12", scene: "date", title: "シャツワンピースで大人デート", img: "1621390636143-e8847ef86809", items: ["p16", "p24", "p21"], ages: ["30s", "40s"], tastes: ["feminine", "natural"], desc: "ベージュのシャツワンピースは、カジュアルすぎず頑張りすぎない大人のデート服。", tips: ["ウエストをベルトでマークしてメリハリを"] },
    // お呼ばれ
    { id: "o13", scene: "oyobare", title: "ドレープワンピースで華やかに", img: "1499939667766-4afceb292d05", items: ["p22", "p17", "p24"], ages: ["20s", "30s"], tastes: ["feminine"], desc: "結婚式のお呼ばれにも安心なくすみピンク。揺れるドレープで写真映えも◎。", tips: ["白っぽく見える色は避けるのがマナー", "肩が出るデザインはボレロを"] },
    { id: "o14", scene: "oyobare", title: "グリーンのワンピースで上品に", img: "1666162201218-79e596c6f206", items: ["p22", "p17", "p24"], ages: ["30s", "40s"], tastes: ["kireime"], desc: "深みのあるグリーンは、30代・40代のお呼ばれにおすすめの上品カラー。", tips: ["アクセは華奢なゴールドで統一"] },
    { id: "o15", scene: "oyobare", title: "黒ワンピースをクラシカルに", img: "1763906803298-90544fc67abd", items: ["p22", "p17", "p25"], ages: ["30s", "40s"], tastes: ["kireime", "simple"], desc: "黒のワンピースはパールと合わせて華やかに。食事会や式典にも。", tips: ["黒一色のときは小物で明るさをプラス"] },
    { id: "o16", scene: "oyobare", title: "サテントップスで大人のパーティー", img: "1759725415895-775562df4088", items: ["p10", "p22", "p23"], ages: ["20s", "30s"], tastes: ["feminine"], desc: "ツヤのあるサテンのドレープトップスで、二次会や女子会を華やかに。", tips: ["髪はまとめてピアスを主役に"] },
    // 旅行
    { id: "o17", scene: "ryoko", title: "京都さんぽのきれいめカジュアル", img: "1715353305010-cfef30dfe16a", items: ["p04", "p12", "p19"], ages: ["20s", "30s"], tastes: ["casual"], desc: "たくさん歩く京都旅には、スニーカーとデニムで。やさしい色の羽織りで写真映えも。", tips: ["お寺では脱ぎやすい靴がおすすめ"] },
    { id: "o18", scene: "ryoko", title: "大判ストールで秋の街歩き", img: "1544955380-68a72d66ad6b", items: ["p03", "p07", "p18"], ages: ["20s", "30s"], tastes: ["casual", "natural"], desc: "朝晩の寒暖差がある秋の旅行には、ストールとコートで温度調節を。", tips: ["ストールはブランケット代わりにも"] },
    { id: "o19", scene: "ryoko", title: "湖畔でピンクカーディガン", img: "1679802411227-9e1f5f7ad430", items: ["p04", "p12", "p19"], ages: ["20s"], tastes: ["casual", "feminine"], desc: "自然の中ではやさしいピンクがよく映えます。旅行写真を明るい印象に。", tips: ["荷物を減らすなら着回せる色を選んで"] },
    { id: "o20", scene: "ryoko", title: "紅葉狩りの動きやすいコーデ", img: "1737449149928-965d1258a518", items: ["p09", "p21", "p19"], ages: ["30s", "40s"], tastes: ["casual", "natural"], desc: "ワイドパンツとスニーカーで、階段や坂道の多い紅葉スポットも快適に。", tips: ["リュックかトートで両手をあけて"] },
    // おうち時間
    { id: "o21", scene: "ouchi", title: "リネンのセットアップでくつろぐ", img: "1768064722888-2136781a4150", items: ["p06", "p09", "p25"], ages: ["30s", "40s"], tastes: ["natural"], desc: "肌ざわりのいいリネンで、おうちでも心地よく、きちんと感もキープ。", tips: ["宅配やご近所への外出もそのままOK"] },
    { id: "o22", scene: "ouchi", title: "白ニットでぬくもりおうちコーデ", img: "1542834240-c28a3c44dad1", items: ["p03", "p12", "p25"], ages: ["20s", "30s"], tastes: ["simple"], desc: "やわらかな白ニットは、寒くなる季節のおうち時間の相棒。", tips: ["ニットは手洗い表示を確認してお手入れを"] },
    { id: "o23", scene: "ouchi", title: "グリーンニットでほっこり", img: "1625520109015-2ee42baffda6", items: ["p04", "p09", "p21"], ages: ["20s", "30s"], tastes: ["natural", "casual"], desc: "くすみグリーンのニットは、ナチュラルで落ち着いた雰囲気に。", tips: ["ボトムはベージュで柔らかく"] },
    { id: "o24", scene: "ouchi", title: "ロングシャツでゆるっと", img: "1768064903881-a20f34e8253b", items: ["p06", "p09", "p21"], ages: ["30s", "40s"], tastes: ["natural", "simple"], desc: "ゆったりしたリネンシャツとパンツで、リラックスしながらも生活感が出すぎない装い。", tips: ["袖をまくって手首を見せるとすっきり"] },
  ];

  const shops = [
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

  const posts = [
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

  const community = [
    "1697731136759-c2963bf94075",
    "1697731133066-a1b450b31725",
    "1630203340413-22c831d699e7",
    "1650275203831-a15545da9e94",
    "1674654442933-b3ef49a8456f",
    "1526720433762-3508756eb910",
    "1772442164696-7d65192147ea",
    "1774803681512-c40efc627ef4",
  ];

  const heroSlides = [
    { img: "1527063652841-2920dd529e30", pos: "center 35%", title: "おしゃれは、<br>もっと簡単に。", text: "今日のトレンド、シーン別コーデ、人気ショップまで。忙しい毎日でも、わたしらしい着こなしが見つかる場所。" },
    { img: "1546859028-196808f21cd7", pos: "center 30%", title: "2026秋冬は<br>ブラウンが主役。", text: "キャメル、モカ、チョコレート。深みのあるブラウンで、今年らしい大人の秋コーデを。" },
    { img: "1681828304358-cccb7b98fe63", pos: "center 25%", title: "迷ったら、<br>シーンで選ぶ。", text: "通勤、デート、お呼ばれ、旅行。シーンを選ぶだけで、今日のコーデが決まります。" },
  ];

  return { scenes, ages, tastes, categories, products, trends, outfits, shops, posts, community, heroSlides };
})();
