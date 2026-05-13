// Mealcare レシピデータベース v1.3
// 全33件 / 低脂質・高タンパク・時短（20分以内）基準
// 脂質エネルギー比 ≤ 25% / タンパク質エネルギー比 ≥ 20%

export const RECIPES = [
  {
    id: 1,
    name: '卵白パンケーキ',
    enName: 'Egg White Pancake',
    desc: 'ふわふわ軽いのに大満足。罪悪感ゼロのご褒美パンケーキ',
    scene: ['朝','間食'],
    calRange: 1,
    mainIngredient: '卵',
    cookTimeMin: 10,
    difficulty: 1,
    cal: 220, p: 22, f: 5, c: 22,
    ingredients: [
      { name:'卵', amount:'3個' },
      { name:'ラカント', amount:'大さじ1' },
      { name:'はちみつ', amount:'大さじ1' }
    ],
    steps: [
      '卵を卵白と黄身に分ける',
      '卵白をボウルに入れ泡だて器で泡立てる（冷やしながら混ぜると泡立ちやすい）',
      'しっかり泡立てたら黄身を1個だけ加え優しく混ぜる',
      'クッキングシートを敷き弱火で5分蒸し焼き',
      '表面に火が通ればひっくり返し弱火で2分焼く',
      'お好みではちみつ、ブルーベリーを添えて完成'
    ],
    points: [
      '卵白はしっかり泡立てることでふわふわ食感に',
      '弱火でじっくり蒸し焼きにするのがふくらむコツ',
      'はちみつの量はお好みで調整OK'
    ],
    tags: ['時短','高タンパク','低脂質','ご褒美']
  },
  {
    id: 2,
    name: '鶏むねのレモン蒸し',
    enName: 'Chicken Lemon Steam',
    desc: 'レンチン12分。さっぱり高タンパクの王道',
    scene: ['昼','夕'],
    calRange: 1,
    mainIngredient: '鶏むね',
    cookTimeMin: 12,
    difficulty: 1,
    cal: 280, p: 38, f: 5, c: 8,
    ingredients: [
      { name:'鶏むね肉(皮なし)', amount:'200g' },
      { name:'レモン', amount:'1/2個' },
      { name:'塩こしょう', amount:'適量' },
      { name:'酒', amount:'大さじ1' }
    ],
    steps: [
      '鶏むね肉をそぎ切りにする',
      '塩こしょう・酒・レモン汁をふる',
      '耐熱皿に並べラップして600W7分加熱',
      '余熱で2分蒸らしてレモンスライスを添える'
    ],
    points: [
      '余熱で火を通すとしっとり仕上がる',
      'レモンは皮ごと使うと香りが立つ',
      '冷蔵で3日保存可、作り置きにも◎'
    ],
    tags: ['時短','レンチン','高タンパク','低脂質']
  },
  {
    id: 3,
    name: 'サバ缶トマト煮',
    enName: 'Mackerel Tomato Stew',
    desc: '缶詰2つで完成。EPA・DHA満点の地中海風',
    scene: ['昼','夕'],
    calRange: 2,
    mainIngredient: '魚',
    cookTimeMin: 8,
    difficulty: 1,
    cal: 340, p: 28, f: 9, c: 18,
    ingredients: [
      { name:'サバ水煮缶', amount:'1缶(190g)' },
      { name:'トマト缶', amount:'1/2缶' },
      { name:'玉ねぎ', amount:'1/4個' },
      { name:'にんにく', amount:'1片' },
      { name:'塩こしょう', amount:'適量' }
    ],
    steps: [
      '玉ねぎとにんにくをみじん切り',
      'フライパンで玉ねぎを透き通るまで炒める',
      'トマト缶とサバ缶を汁ごと加え3分煮る',
      '塩こしょうで味を調えて完成'
    ],
    points: [
      'サバの汁にはDHAが溶けているので捨てない',
      'バジルを散らすと本格的な仕上がり',
      'パスタや雑穀ご飯と相性抜群'
    ],
    tags: ['時短','缶詰','高タンパク','オメガ3']
  },
  {
    id: 4,
    name: '豆腐そぼろ丼',
    enName: 'Tofu Soboro Bowl',
    desc: '肉なしなのに大満足。植物性タンパク質の宝庫',
    scene: ['昼','夕'],
    calRange: 2,
    mainIngredient: '豆腐',
    cookTimeMin: 15,
    difficulty: 1,
    cal: 480, p: 26, f: 11, c: 62,
    ingredients: [
      { name:'木綿豆腐', amount:'300g' },
      { name:'醤油', amount:'大さじ2' },
      { name:'みりん', amount:'大さじ1' },
      { name:'生姜', amount:'1片' },
      { name:'ご飯', amount:'150g' },
      { name:'卵黄', amount:'1個' }
    ],
    steps: [
      '豆腐を手で崩しながらフライパンへ',
      '中火で水分が飛ぶまで5分炒める',
      '醤油・みりん・すりおろし生姜を加え3分煮絡める',
      'ご飯にのせて卵黄をトッピング'
    ],
    points: [
      '豆腐をしっかり水切りすると味が締まる',
      '七味やネギで味変もOK',
      '冷蔵で2日保存可'
    ],
    tags: ['時短','植物性','高タンパク','低脂質']
  },
  {
    id: 5,
    name: 'プロテインオートミール',
    enName: 'Protein Oatmeal',
    desc: 'レンチン3分。忙しい朝の最強コンビ',
    scene: ['朝','間食'],
    calRange: 1,
    mainIngredient: 'その他',
    cookTimeMin: 5,
    difficulty: 1,
    cal: 280, p: 28, f: 5, c: 36,
    ingredients: [
      { name:'オートミール', amount:'30g' },
      { name:'プロテインパウダー', amount:'20g' },
      { name:'水or無調整豆乳', amount:'150ml' },
      { name:'バナナ', amount:'1/2本' }
    ],
    steps: [
      'オートミールと水を耐熱ボウルに入れる',
      '600Wで2分加熱',
      'プロテインパウダーを混ぜ込む',
      'スライスしたバナナをのせて完成'
    ],
    points: [
      'プロテインは火を通すと固まるので最後に',
      'シナモンやココアパウダーで風味アップ',
      'ベリー類を加えると満足感UP'
    ],
    tags: ['時短','レンチン','朝食','高タンパク']
  },
  {
    id: 6,
    name: 'ささみのレンチン棒棒鶏',
    enName: 'Steamed Chicken Bang Bang',
    desc: 'レンチン+ごまだれ。中華風の人気副菜',
    scene: ['昼','夕'],
    calRange: 1,
    mainIngredient: '鶏むね',
    cookTimeMin: 8,
    difficulty: 1,
    cal: 250, p: 32, f: 6, c: 12,
    ingredients: [
      { name:'鶏ささみ', amount:'2本(150g)' },
      { name:'きゅうり', amount:'1本' },
      { name:'酒', amount:'大さじ1' },
      { name:'すりごま', amount:'大さじ1' },
      { name:'醤油', amount:'大さじ1' },
      { name:'酢', amount:'小さじ1' }
    ],
    steps: [
      'ささみに酒をふりラップして600W3分',
      '冷めたら手でほぐす',
      'きゅうりを千切りにする',
      'すりごま・醤油・酢を混ぜたタレをかけて完成'
    ],
    points: [
      '加熱しすぎないことでしっとり感キープ',
      'ラー油を少し垂らすと本格中華に',
      '作り置きにも便利'
    ],
    tags: ['時短','レンチン','高タンパク','低脂質']
  },
  {
    id: 7,
    name: 'サーモンの塩昆布蒸し',
    enName: 'Salmon Kombu Steam',
    desc: 'フライパン1つで本格和食。旨味の塊',
    scene: ['夕'],
    calRange: 2,
    mainIngredient: '魚',
    cookTimeMin: 12,
    difficulty: 1,
    cal: 320, p: 30, f: 13, c: 14,
    ingredients: [
      { name:'生鮭', amount:'1切(100g)' },
      { name:'塩昆布', amount:'ひとつまみ' },
      { name:'えのき', amount:'1/2袋' },
      { name:'酒', amount:'大さじ2' },
      { name:'バター', amount:'5g' }
    ],
    steps: [
      'フライパンにえのきを敷き、鮭をのせる',
      '塩昆布と酒をふる',
      '蓋をして弱火で8分蒸し焼き',
      '最後にバターをのせて完成'
    ],
    points: [
      '塩昆布が味付けの主役、調味料いらず',
      'バターは少量で十分風味が出る',
      'えのき以外もしめじやエリンギでOK'
    ],
    tags: ['時短','フライパン1つ','高タンパク']
  },
  {
    id: 8,
    name: '卵焼きツナサンド',
    enName: 'Egg & Tuna Sandwich',
    desc: '高タンパクで腹持ち抜群。コンビニ越え',
    scene: ['朝','間食'],
    calRange: 2,
    mainIngredient: '卵',
    cookTimeMin: 10,
    difficulty: 1,
    cal: 380, p: 28, f: 10, c: 38,
    ingredients: [
      { name:'食パン', amount:'2枚' },
      { name:'卵', amount:'2個' },
      { name:'ツナ缶ノンオイル', amount:'1/2缶' },
      { name:'ギリシャヨーグルト', amount:'大さじ1' },
      { name:'塩こしょう', amount:'適量' }
    ],
    steps: [
      '卵を溶きフライパンで厚焼きにする',
      'ツナとヨーグルトを混ぜ塩こしょう',
      'パンに卵焼きとツナマヨ風を挟む',
      '半分に切って完成'
    ],
    points: [
      'マヨ代わりのヨーグルトで脂質カット',
      '全粒粉パンに変えると栄養価UP',
      '冷蔵で半日OKなのでお弁当にも'
    ],
    tags: ['時短','朝食','高タンパク','満腹']
  },
  {
    id: 9,
    name: '鶏ももの照り焼き丼（皮なし）',
    enName: 'Teriyaki Chicken Bowl',
    desc: '皮を外して脂質を抑えた満足感ある定番',
    scene: ['昼','夕'],
    calRange: 3,
    mainIngredient: '鶏もも',
    cookTimeMin: 18,
    difficulty: 2,
    cal: 580, p: 35, f: 13, c: 70,
    ingredients: [
      { name:'鶏もも肉(皮を取る)', amount:'200g' },
      { name:'醤油', amount:'大さじ1.5' },
      { name:'みりん', amount:'大さじ1.5' },
      { name:'砂糖', amount:'小さじ1' },
      { name:'ご飯', amount:'180g' }
    ],
    steps: [
      '鶏ももの皮と余分な脂を取り除く',
      'フライパンで両面5分ずつ焼く',
      '醤油・みりん・砂糖を加え絡める',
      'ご飯にのせて完成'
    ],
    points: [
      '皮を取ると脂質が大幅カット',
      '余分な脂はキッチンペーパーで拭くとさらにヘルシー',
      '七味で味変も◎'
    ],
    tags: ['時短','定番','高タンパク']
  },
  {
    id: 10,
    name: '豆腐ナゲット',
    enName: 'Tofu Nuggets',
    desc: '揚げないのにジューシー。子どもも喜ぶ',
    scene: ['間食'],
    calRange: 1,
    mainIngredient: '豆腐',
    cookTimeMin: 12,
    difficulty: 2,
    cal: 180, p: 18, f: 5, c: 16,
    ingredients: [
      { name:'木綿豆腐', amount:'150g' },
      { name:'鶏むねひき肉', amount:'80g' },
      { name:'片栗粉', amount:'大さじ2' },
      { name:'塩こしょう', amount:'適量' },
      { name:'油', amount:'小さじ1' }
    ],
    steps: [
      '豆腐の水を切る（キッチンペーパーで包んでレンチン2分）',
      '豆腐・ひき肉・片栗粉・塩こしょうを混ぜる',
      'スプーンですくいフライパンへ',
      '中火で両面4分ずつ焼いて完成'
    ],
    points: [
      'ケチャップやマスタードで味変',
      '油は焼くだけなので少量でOK',
      '冷凍保存可、お弁当にも'
    ],
    tags: ['時短','揚げない','高タンパク','間食']
  },
  {
    id: 11,
    name: '鶏むねトマト無水カレー',
    enName: 'Chicken Tomato Curry',
    desc: '水を使わず野菜の旨味を凝縮。スパイス香る本格派',
    scene: ['夕'],
    calRange: 2,
    mainIngredient: '鶏むね',
    cookTimeMin: 20,
    difficulty: 2,
    cal: 520, p: 38, f: 10, c: 65,
    ingredients: [
      { name:'鶏むね肉(皮なし)', amount:'200g' },
      { name:'トマト缶', amount:'1/2缶' },
      { name:'玉ねぎ', amount:'1/2個' },
      { name:'カレーペースト', amount:'25g' },
      { name:'ご飯', amount:'150g' }
    ],
    steps: [
      '鶏むねを一口大に切り塩こしょう',
      'フライパンで鶏むねと玉ねぎを炒める',
      'トマト缶を加え蓋をして10分煮込む',
      'カレーペーストを溶かし入れ3分煮込む',
      'ご飯にかけて完成'
    ],
    points: [
      '水を入れず野菜の水分だけで煮込むと旨味凝縮',
      'マッサマンカレーペーストは少量でも満足感◎',
      '冷蔵で3日保存可'
    ],
    tags: ['時短','無水','高タンパク','低脂質']
  },
  {
    id: 12,
    name: '高タンパクオムレツ',
    enName: 'High Protein Omelet',
    desc: 'カッテージチーズで脂質を抑えた朝の一皿',
    scene: ['朝'],
    calRange: 1,
    mainIngredient: '卵',
    cookTimeMin: 8,
    difficulty: 2,
    cal: 240, p: 24, f: 12, c: 6,
    ingredients: [
      { name:'卵', amount:'2個' },
      { name:'卵白', amount:'1個分' },
      { name:'カッテージチーズ', amount:'30g' },
      { name:'ほうれん草', amount:'30g' },
      { name:'塩こしょう', amount:'適量' }
    ],
    steps: [
      'ほうれん草をざく切りにする',
      '卵と卵白を溶き塩こしょう',
      'フライパンに卵液を流しほうれん草を加える',
      '半熟になったらカッテージチーズをのせ折りたたむ'
    ],
    points: [
      '卵白を追加することで脂質を抑えてタンパク質UP',
      'カッテージチーズはモッツァレラより低脂質',
      '弱火でじっくりがふんわりのコツ'
    ],
    tags: ['朝食','時短','高タンパク','低脂質']
  },
  {
    id: 13,
    name: 'ツナとブロッコリーのパスタ',
    enName: 'Tuna Broccoli Pasta',
    desc: 'オイル不使用ツナで脂質カット。15分の本格イタリアン',
    scene: ['昼'],
    calRange: 2,
    mainIngredient: '魚',
    cookTimeMin: 15,
    difficulty: 1,
    cal: 460, p: 28, f: 6, c: 72,
    ingredients: [
      { name:'パスタ', amount:'80g' },
      { name:'ツナ缶ノンオイル', amount:'1缶' },
      { name:'ブロッコリー', amount:'80g' },
      { name:'にんにく', amount:'1片' },
      { name:'塩こしょう', amount:'適量' },
      { name:'オリーブ油', amount:'小さじ1' }
    ],
    steps: [
      'パスタとブロッコリーを同じ鍋で茹でる',
      'フライパンでにんにくを炒める',
      'ツナと茹で汁少々を加え混ぜる',
      'パスタとブロッコリーを和えて塩こしょう'
    ],
    points: [
      'ブロッコリーは同じ鍋で時短',
      '茹で汁を加えると乳化してパスタソースに',
      'レモンを絞ると爽やかさUP'
    ],
    tags: ['時短','昼食','高タンパク','低脂質']
  },
  {
    id: 14,
    name: 'プロテインスムージー',
    enName: 'Protein Smoothie',
    desc: '混ぜるだけ3分。忙しい朝の最強リカバリー',
    scene: ['朝','間食'],
    calRange: 1,
    mainIngredient: 'その他',
    cookTimeMin: 3,
    difficulty: 1,
    cal: 220, p: 26, f: 4, c: 22,
    ingredients: [
      { name:'プロテインパウダー', amount:'25g' },
      { name:'無調整豆乳', amount:'200ml' },
      { name:'冷凍ベリー', amount:'50g' },
      { name:'バナナ', amount:'1/2本' }
    ],
    steps: [
      '全ての材料をブレンダーに入れる',
      '30秒攪拌',
      'グラスに注いで完成'
    ],
    points: [
      '冷凍ベリーで氷代わり、栄養価もUP',
      'ほうれん草を一掴み入れても気にならない',
      'タンパク質26gで朝の筋肉合成に最適'
    ],
    tags: ['時短','朝食','高タンパク','超簡単']
  },
  {
    id: 15,
    name: '豆腐とキムチの炒め物',
    enName: 'Tofu Kimchi Stir-fry',
    desc: '発酵食×植物性タンパク。腸活×ダイエット',
    scene: ['夕'],
    calRange: 1,
    mainIngredient: '豆腐',
    cookTimeMin: 10,
    difficulty: 1,
    cal: 280, p: 20, f: 13, c: 18,
    ingredients: [
      { name:'木綿豆腐', amount:'200g' },
      { name:'キムチ', amount:'80g' },
      { name:'ニラ', amount:'1/4束' },
      { name:'ごま油', amount:'小さじ1' },
      { name:'醤油', amount:'小さじ1' }
    ],
    steps: [
      '豆腐の水を切り食べやすい大きさに切る',
      'フライパンにごま油を熱し豆腐を焼く',
      '焼き目がついたらキムチとニラを加え炒める',
      '醤油で味を調えて完成'
    ],
    points: [
      'キムチの塩気で調味料は最小限でOK',
      '豆腐は崩しすぎないのがコツ',
      'ご飯にのせて丼にしても◎'
    ],
    tags: ['時短','発酵食','高タンパク','腸活']
  },
  {
    id: 16,
    name: 'サーモン丼',
    enName: 'Salmon Bowl',
    desc: '切って乗せるだけ5分。オメガ3たっぷり',
    scene: ['昼','夕'],
    calRange: 2,
    mainIngredient: '魚',
    cookTimeMin: 5,
    difficulty: 1,
    cal: 540, p: 32, f: 14, c: 60,
    ingredients: [
      { name:'刺身用サーモン', amount:'120g' },
      { name:'ご飯', amount:'150g' },
      { name:'醤油', amount:'大さじ1' },
      { name:'卵黄', amount:'1個' },
      { name:'のり', amount:'適量' },
      { name:'青ネギ', amount:'適量' }
    ],
    steps: [
      'サーモンを薄切りにする',
      'ご飯の上にのりとサーモンを並べる',
      '卵黄をのせ醤油を回しかける',
      '青ネギを散らして完成'
    ],
    points: [
      '生サーモンはオメガ3が酸化していないので最強',
      'わさびを少し添えると本格的に',
      'アボカドを足しても◎（脂質注意）'
    ],
    tags: ['超時短','高タンパク','生','オメガ3']
  },
  {
    id: 17,
    name: '鶏むねの梅しそ蒸し',
    enName: 'Chicken Plum-Shiso Steam',
    desc: 'さっぱり和風。夏でも食欲が湧く一品',
    scene: ['夕'],
    calRange: 1,
    mainIngredient: '鶏むね',
    cookTimeMin: 12,
    difficulty: 1,
    cal: 240, p: 36, f: 4, c: 8,
    ingredients: [
      { name:'鶏むね肉(皮なし)', amount:'180g' },
      { name:'梅干し', amount:'2個' },
      { name:'大葉', amount:'5枚' },
      { name:'酒', amount:'大さじ1' }
    ],
    steps: [
      '鶏むね肉をそぎ切りに',
      '梅干しを叩いて練りペーストに',
      '鶏むねに梅ペーストを塗り大葉で巻く',
      '耐熱皿に並べ酒をふって600W6分'
    ],
    points: [
      '梅の塩分で味付け完了、調味料いらず',
      '大葉は最後にちぎってのせるのもアリ',
      '冷やしても美味しい'
    ],
    tags: ['時短','レンチン','高タンパク','超低脂質']
  },
  {
    id: 18,
    name: '卵スープ',
    enName: 'Egg Drop Soup',
    desc: '5分で完成、満足感のあるスープ',
    scene: ['朝','間食'],
    calRange: 1,
    mainIngredient: '卵',
    cookTimeMin: 5,
    difficulty: 1,
    cal: 130, p: 12, f: 7, c: 4,
    ingredients: [
      { name:'卵', amount:'1個' },
      { name:'鶏ガラスープの素', amount:'小さじ1' },
      { name:'水', amount:'250ml' },
      { name:'青ネギ', amount:'適量' },
      { name:'ごま油', amount:'数滴' }
    ],
    steps: [
      '鍋に水と鶏ガラスープの素を入れ沸かす',
      '溶き卵を細く回し入れる',
      '青ネギとごま油を加えて完成'
    ],
    points: [
      '沸騰した湯に卵を入れるとふわっと仕上がる',
      '水溶き片栗粉を入れるととろみスープに',
      '冷蔵庫の野菜を加えれば栄養価UP'
    ],
    tags: ['超時短','朝食','低カロリー','タンパク質']
  },
  {
    id: 19,
    name: '厚揚げのねぎ味噌焼き',
    enName: 'Atsuage Negi-Miso',
    desc: '焼くだけ10分。お酒のおつまみにも',
    scene: ['夕'],
    calRange: 2,
    mainIngredient: '豆腐',
    cookTimeMin: 10,
    difficulty: 1,
    cal: 320, p: 24, f: 15, c: 18,
    ingredients: [
      { name:'厚揚げ', amount:'1枚(200g)' },
      { name:'青ネギ', amount:'2本' },
      { name:'味噌', amount:'大さじ1' },
      { name:'みりん', amount:'小さじ1' },
      { name:'すりごま', amount:'小さじ1' }
    ],
    steps: [
      '厚揚げを8等分に切る',
      '青ネギを小口切りに',
      '味噌・みりん・すりごま・ネギを混ぜる',
      'フライパンで厚揚げを両面3分ずつ焼く',
      '味噌だれをのせて完成'
    ],
    points: [
      '厚揚げは油抜きすると味が染みやすい',
      '味噌だれは作り置きOK',
      'ご飯にも合う万能おかず'
    ],
    tags: ['時短','和食','高タンパク','植物性']
  },
  {
    id: 20,
    name: '鶏もも野菜蒸し',
    enName: 'Chicken Veggie Steam',
    desc: 'フライパン1つでバランス満点',
    scene: ['夕'],
    calRange: 2,
    mainIngredient: '鶏もも',
    cookTimeMin: 15,
    difficulty: 2,
    cal: 480, p: 32, f: 13, c: 42,
    ingredients: [
      { name:'鶏もも肉(皮を取る)', amount:'180g' },
      { name:'もやし', amount:'1袋' },
      { name:'キャベツ', amount:'1/8玉' },
      { name:'酒', amount:'大さじ2' },
      { name:'ポン酢', amount:'適量' }
    ],
    steps: [
      'キャベツをざく切りに',
      'フライパンにもやし・キャベツを敷く',
      '上に切った鶏ももをのせ酒をふる',
      '蓋をして中火10分蒸し焼き',
      'ポン酢をかけて完成'
    ],
    points: [
      '野菜から出る水分で蒸せるので水不要',
      '鶏皮を外すと脂質を大幅カット',
      '柚子こしょうも合う'
    ],
    tags: ['時短','フライパン1つ','野菜','高タンパク']
  },
  {
    id: 21,
    name: 'プロテインヨーグルトボウル',
    enName: 'Protein Yogurt Bowl',
    desc: '混ぜるだけ3分。朝の最強ルーティン',
    scene: ['朝','間食'],
    calRange: 1,
    mainIngredient: 'その他',
    cookTimeMin: 3,
    difficulty: 1,
    cal: 280, p: 30, f: 6, c: 28,
    ingredients: [
      { name:'ギリシャヨーグルト', amount:'150g' },
      { name:'プロテインパウダー', amount:'15g' },
      { name:'バナナ', amount:'1/2本' },
      { name:'グラノーラ', amount:'15g' },
      { name:'はちみつ', amount:'小さじ1' }
    ],
    steps: [
      'ヨーグルトにプロテインを混ぜる',
      'スライスバナナをのせる',
      'グラノーラをトッピング',
      'はちみつを回しかけて完成'
    ],
    points: [
      'ギリシャヨーグルトでタンパク質倍増',
      'ナッツやベリーで栄養価UP',
      '前夜に仕込んでおけば朝開けるだけ'
    ],
    tags: ['超時短','朝食','高タンパク','低脂質']
  },
  {
    id: 22,
    name: '鯖のおろしポン酢',
    enName: 'Mackerel with Grated Daikon',
    desc: 'さっぱり和食。EPA・DHAしっかり',
    scene: ['夕'],
    calRange: 2,
    mainIngredient: '魚',
    cookTimeMin: 10,
    difficulty: 1,
    cal: 360, p: 28, f: 12, c: 18,
    ingredients: [
      { name:'鯖の切り身', amount:'1切(100g)' },
      { name:'大根', amount:'5cm' },
      { name:'ポン酢', amount:'大さじ2' },
      { name:'青ネギ', amount:'適量' }
    ],
    steps: [
      '鯖に塩を振り10分置いて水気を拭く',
      'グリルで両面4分ずつ焼く',
      '大根をすりおろす',
      '鯖におろしとポン酢、ネギをのせて完成'
    ],
    points: [
      '塩を振って水気を取ると臭み消し',
      '大根おろしで脂質の消化を助ける',
      'グリル代わりにフライパン+クッキングシートでもOK'
    ],
    tags: ['時短','和食','オメガ3','高タンパク']
  },
  {
    id: 23,
    name: 'ささみと豆腐のお吸い物',
    enName: 'Chicken Tofu Soup',
    desc: '優しい味の高タンパクスープ',
    scene: ['朝','夕'],
    calRange: 1,
    mainIngredient: '鶏むね',
    cookTimeMin: 8,
    difficulty: 1,
    cal: 160, p: 20, f: 5, c: 6,
    ingredients: [
      { name:'鶏ささみ', amount:'1本' },
      { name:'絹豆腐', amount:'100g' },
      { name:'白だし', amount:'大さじ1' },
      { name:'水', amount:'300ml' },
      { name:'三つ葉', amount:'適量' }
    ],
    steps: [
      'ささみを薄切りに、豆腐を角切りに',
      '鍋に水と白だしを入れ沸かす',
      'ささみと豆腐を加え3分煮る',
      '三つ葉を散らして完成'
    ],
    points: [
      'ささみは火を通しすぎないとしっとり',
      'えのきや三つ葉で香りUP',
      '体を温める朝食におすすめ'
    ],
    tags: ['時短','和食','低カロリー','高タンパク']
  },
  {
    id: 24,
    name: '鶏むね肉のチーズ蒸し',
    enName: 'Chicken Cheese Steam',
    desc: 'チーズで満足感、脂質は抑えめ',
    scene: ['夕'],
    calRange: 2,
    mainIngredient: '鶏むね',
    cookTimeMin: 15,
    difficulty: 2,
    cal: 320, p: 40, f: 10, c: 12,
    ingredients: [
      { name:'鶏むね肉(皮なし)', amount:'200g' },
      { name:'カッテージチーズ', amount:'40g' },
      { name:'トマト', amount:'1/2個' },
      { name:'バジル', amount:'適量' },
      { name:'塩こしょう', amount:'適量' }
    ],
    steps: [
      '鶏むね肉をそぎ切りにし塩こしょう',
      '耐熱皿に並べトマトスライスをのせる',
      'カッテージチーズをのせラップで600W7分',
      'バジルを散らして完成'
    ],
    points: [
      'カッテージチーズはピザ用より低脂質',
      'トマトの酸味で鶏むねがしっとり',
      '冷蔵で2日保存可'
    ],
    tags: ['時短','レンチン','高タンパク','低脂質']
  },
  {
    id: 25,
    name: '高タンパク卵かけご飯',
    enName: 'Protein TKG',
    desc: 'TKGをプロテインで進化させた3分飯',
    scene: ['朝','昼'],
    calRange: 2,
    mainIngredient: '卵',
    cookTimeMin: 3,
    difficulty: 1,
    cal: 380, p: 22, f: 8, c: 56,
    ingredients: [
      { name:'ご飯', amount:'150g' },
      { name:'卵', amount:'1個' },
      { name:'納豆', amount:'1パック' },
      { name:'醤油', amount:'小さじ1' },
      { name:'青ネギ', amount:'適量' }
    ],
    steps: [
      'ご飯に納豆をのせる',
      '卵を割り入れる',
      '醤油とネギをのせて混ぜる'
    ],
    points: [
      '納豆を足すだけで植物性タンパク質UP',
      'のりや胡麻で栄養価UP',
      '一番手軽な朝食'
    ],
    tags: ['超時短','朝食','高タンパク','和食']
  },
  {
    id: 26,
    name: '豆腐ステーキおろしポン酢',
    enName: 'Tofu Steak',
    desc: '焼くだけ10分。さっぱり夕食の主役',
    scene: ['夕'],
    calRange: 1,
    mainIngredient: '豆腐',
    cookTimeMin: 10,
    difficulty: 1,
    cal: 260, p: 20, f: 12, c: 16,
    ingredients: [
      { name:'木綿豆腐', amount:'300g' },
      { name:'大根', amount:'5cm' },
      { name:'ポン酢', amount:'大さじ1' },
      { name:'青ネギ', amount:'適量' },
      { name:'片栗粉', amount:'小さじ2' },
      { name:'油', amount:'小さじ1' }
    ],
    steps: [
      '豆腐の水を切り片栗粉をまぶす',
      'フライパンで両面3分ずつ焼く',
      '大根おろしを作る',
      '豆腐に大根おろしとポン酢、ネギをのせて完成'
    ],
    points: [
      '片栗粉でカリッと食感',
      '水切りはレンチン2分で時短',
      '油はテフロンなら不要でも'
    ],
    tags: ['時短','和食','植物性','低カロリー']
  },
  {
    id: 27,
    name: '鶏もも肉のヨーグルトカレー',
    enName: 'Yogurt Chicken Curry',
    desc: 'タンドリー風スパイスカレー',
    scene: ['夕'],
    calRange: 3,
    mainIngredient: '鶏もも',
    cookTimeMin: 20,
    difficulty: 2,
    cal: 620, p: 36, f: 16, c: 75,
    ingredients: [
      { name:'鶏もも肉(皮を取る)', amount:'200g' },
      { name:'プレーンヨーグルト', amount:'100g' },
      { name:'カレー粉', amount:'大さじ1' },
      { name:'にんにく・生姜', amount:'各1片' },
      { name:'ご飯', amount:'180g' }
    ],
    steps: [
      '鶏ももをヨーグルトとカレー粉に10分漬ける',
      'フライパンで両面焼き色をつける',
      '蓋をして弱火で7分蒸し焼き',
      'ご飯にのせて完成'
    ],
    points: [
      'ヨーグルトの酵素で肉が柔らかくなる',
      '生クリーム不使用で脂質カット',
      '皮を外すとさらに低脂質'
    ],
    tags: ['時短','カレー','高タンパク','エスニック']
  },
  {
    id: 28,
    name: 'プロテインアイス',
    enName: 'Protein Ice',
    desc: '混ぜて冷やすだけ。罪悪感ゼロデザート',
    scene: ['間食'],
    calRange: 1,
    mainIngredient: 'その他',
    cookTimeMin: 5,
    difficulty: 1,
    cal: 180, p: 24, f: 4, c: 14,
    ingredients: [
      { name:'プロテインパウダー', amount:'25g' },
      { name:'無調整豆乳', amount:'150ml' },
      { name:'冷凍ベリー', amount:'40g' },
      { name:'ラカント', amount:'小さじ1' }
    ],
    steps: [
      '全材料をブレンダーで攪拌',
      '容器に入れ冷凍庫で2時間',
      '途中でかき混ぜるとシャリ感UP',
      '完成（凍らせ時間は別途）'
    ],
    points: [
      'チョコ味プロテインならココアアイスに',
      'バナナを加えると自然な甘み',
      '夏のおやつにぴったり'
    ],
    tags: ['時短','間食','高タンパク','スイーツ']
  },
  {
    id: 29,
    name: 'サラダチキン丼',
    enName: 'Salad Chicken Bowl',
    desc: '市販品で5分の最速高タンパク丼',
    scene: ['昼'],
    calRange: 2,
    mainIngredient: '鶏むね',
    cookTimeMin: 5,
    difficulty: 1,
    cal: 460, p: 35, f: 6, c: 60,
    ingredients: [
      { name:'サラダチキン', amount:'1個(110g)' },
      { name:'ご飯', amount:'150g' },
      { name:'温泉卵', amount:'1個' },
      { name:'のり', amount:'適量' },
      { name:'ごま油', amount:'数滴' },
      { name:'醤油', amount:'小さじ1' }
    ],
    steps: [
      'サラダチキンをほぐす',
      'ご飯にのりを散らしチキンをのせる',
      '温泉卵を割り入れる',
      'ごま油と醤油を回しかけて完成'
    ],
    points: [
      'コンビニ食材だけで作れる手軽さ',
      'キムチや青ネギで味変',
      '昼食の救世主'
    ],
    tags: ['超時短','昼食','高タンパク','低脂質']
  },
  {
    id: 30,
    name: '豆乳茶碗蒸し',
    enName: 'Soy Milk Chawanmushi',
    desc: 'レンチン10分。優しい味のタンパク質補給',
    scene: ['朝','夕','間食'],
    calRange: 1,
    mainIngredient: '卵',
    cookTimeMin: 12,
    difficulty: 2,
    cal: 180, p: 16, f: 9, c: 8,
    ingredients: [
      { name:'卵', amount:'1個' },
      { name:'無調整豆乳', amount:'150ml' },
      { name:'白だし', amount:'小さじ2' },
      { name:'むきえび', amount:'4尾' },
      { name:'三つ葉', amount:'少々' }
    ],
    steps: [
      '卵を溶き豆乳と白だしを混ぜる',
      '茶こしで濾して器に注ぐ',
      'えびと三つ葉を加える',
      'ラップして600W3分→200W7分'
    ],
    points: [
      '弱出力でじっくり加熱が滑らかさのコツ',
      '豆乳でカルシウムとイソフラボン補給',
      '冷やしても美味しい'
    ],
    tags: ['時短','レンチン','和食','高タンパク']
  },
  {
    id: 31,
    name: '鶏むね特大丼',
    enName: 'Big Chicken Bowl',
    desc: '300gの鶏むねを乗せた満腹ヘルシー丼',
    scene: ['昼','夕'],
    calRange: 4,
    mainIngredient: '鶏むね',
    cookTimeMin: 15,
    difficulty: 2,
    cal: 760, p: 60, f: 8, c: 100,
    ingredients: [
      { name:'鶏むね肉(皮なし)', amount:'300g' },
      { name:'ご飯', amount:'200g' },
      { name:'温泉卵', amount:'1個' },
      { name:'のり', amount:'適量' },
      { name:'醤油', amount:'大さじ1' },
      { name:'みりん', amount:'大さじ1' },
      { name:'青ネギ', amount:'適量' }
    ],
    steps: [
      '鶏むねをそぎ切りにし塩こしょう',
      'フライパンで両面焼き、醤油みりんで照りを出す',
      '丼にご飯とのり、鶏むねをのせる',
      '温泉卵をトッピングしネギを散らして完成'
    ],
    points: [
      '300gで60gの高タンパク質',
      '皮を取って脂質を抑えた満腹丼',
      'トレ後の食事に最適'
    ],
    tags: ['がっつり','高タンパク','低脂質','時短']
  },
  {
    id: 32,
    name: 'サーモンとアボカドのポキ丼',
    enName: 'Salmon Poke Bowl',
    desc: '切って乗せるだけのハワイアン丼',
    scene: ['昼','夕'],
    calRange: 4,
    mainIngredient: '魚',
    cookTimeMin: 10,
    difficulty: 1,
    cal: 720, p: 42, f: 20, c: 80,
    ingredients: [
      { name:'刺身用サーモン', amount:'180g' },
      { name:'アボカド', amount:'1/2個' },
      { name:'ご飯', amount:'180g' },
      { name:'醤油', amount:'大さじ1.5' },
      { name:'ごま油', amount:'小さじ1' },
      { name:'卵黄', amount:'1個' },
      { name:'のり', amount:'適量' },
      { name:'青ネギ', amount:'適量' }
    ],
    steps: [
      'サーモンとアボカドを角切りにする',
      '醤油・ごま油と和えて10分置く',
      'ご飯にのり・サーモン・アボカドを乗せる',
      '卵黄とネギをトッピングして完成'
    ],
    points: [
      'サーモンのオメガ3で脂質は良質',
      'アボカドの食物繊維で腹持ち抜群',
      '生サーモンは抗酸化が損なわれない'
    ],
    tags: ['がっつり','高タンパク','オメガ3','時短']
  },
  {
    id: 33,
    name: '鶏もも野菜炒め定食',
    enName: 'Chicken Veggie Set',
    desc: 'ご飯がすすむがっつり定食',
    scene: ['昼','夕'],
    calRange: 4,
    mainIngredient: '鶏もも',
    cookTimeMin: 18,
    difficulty: 2,
    cal: 780, p: 48, f: 19, c: 95,
    ingredients: [
      { name:'鶏もも肉(皮を取る)', amount:'250g' },
      { name:'もやし', amount:'1袋' },
      { name:'ピーマン', amount:'1個' },
      { name:'にんじん', amount:'1/4本' },
      { name:'ご飯', amount:'200g' },
      { name:'醤油', amount:'大さじ1.5' },
      { name:'にんにく', amount:'1片' },
      { name:'豆板醤', amount:'小さじ1/2' }
    ],
    steps: [
      '鶏ももを一口大、野菜を細切りに',
      'にんにくを炒めて鶏ももを焼く',
      '野菜を加えて炒める',
      '醤油と豆板醤で味付け',
      'ご飯と一緒に盛り付けて完成'
    ],
    points: [
      '皮を取ることで250gでも脂質19g',
      '野菜たっぷりで食物繊維も補える',
      '筋トレ後のご飯にぴったり'
    ],
    tags: ['がっつり','高タンパク','野菜','満腹']
  }
];
