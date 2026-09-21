// ポッドキャスト用の RSS を組み立てる
// ---------------------------------------------------------------------------
// これがあると、Apple Podcasts・Spotify・Pocket Casts などに
// 自分専用の番組として登録できる。ロック画面、バックグラウンド再生、
// オフライン、再生位置の記憶が、全部そちら側の機能で手に入る。
//
// 仕様上けちってはいけないところ。
//   - <enclosure> に音声の URL・バイト数・MIME を正しく入れる
//   - <guid> をエピソードごとに一意にする
//   - itunes 名前空間を宣言する

function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toRfc822(iso) {
  const d = iso ? new Date(iso) : new Date();
  return (Number.isNaN(d.getTime()) ? new Date() : d).toUTCString();
}

function durationLabelFromSeconds(seconds) {
  const total = Math.max(1, Math.round(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function durationLabel(minutes) {
  const total = Math.max(1, Math.round((minutes || 1) * 60));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * エピソードの説明文。台本そのものではなく、何を扱ったかの要約と出典を載せる。
 * ポッドキャストアプリの説明欄からリンクを踏めるようにしておくと、
 * 聞いて気になった記事に後からたどり着ける。
 */
function buildDescription(episode) {
  const lines = [];
  if (episode.terms?.length) {
    lines.push(`今日の用語: ${episode.terms.map((t) => t.term).join('、')}`);
    lines.push('');
  }
  const refs = [...(episode.items?.deepDive || []), ...(episode.items?.roundup || [])];
  if (refs.length) {
    lines.push('取り上げた記事:');
    for (const ref of refs) {
      lines.push(`・${ref.title}（${ref.sourceName}） ${ref.url}`);
    }
  }
  return lines.join('\n').trim();
}

export function buildPodcastFeed({
  episodes,
  baseUrl,
  title,
  description,
  author,
  imageUrl,
  // 音声の置き場所は配り方で変わる。
  //   サーバー配信 → /api/audio?id=...
  //   静的配信     → audio/<id>.mp3
  // ここを差し替えられるようにして、フィードの組み立て自体は共通にする。
  audioUrlFor = (episode) => `${baseUrl}/api/audio?id=${encodeURIComponent(episode.id)}`,
  episodeUrlFor = (episode) => `${baseUrl}/?episode=${episode.id}`
}) {
  const feedTitle = title || 'TechCast — IT・SaaS業界の朝';
  const feedDescription =
    description ||
    'IT・SaaS・AI業界のニュースを毎朝まとめて、業界用語の解説とあわせてお届けする個人用の番組です。';
  const feedAuthor = author || 'TechCast';
  const link = baseUrl;
  const image = imageUrl || `${baseUrl}/icon-512.png`;

  const withAudio = episodes.filter((e) => e.audio?.file);

  const items = withAudio
    .map((episode) => {
      const audioUrl = audioUrlFor(episode);
      return `    <item>
      <title>${escapeXml(episode.title)}</title>
      <description>${escapeXml(buildDescription(episode))}</description>
      <pubDate>${toRfc822(episode.createdAt)}</pubDate>
      <guid isPermaLink="false">techcast-${escapeXml(episode.id)}</guid>
      <link>${escapeXml(episodeUrlFor(episode))}</link>
      <enclosure url="${escapeXml(audioUrl)}" length="${episode.audio.bytes}" type="${escapeXml(
        episode.audio.contentType || 'audio/mpeg'
      )}" />
      <itunes:title>${escapeXml(episode.title)}</itunes:title>
      <itunes:duration>${
        episode.audio?.durationSec
          ? durationLabelFromSeconds(episode.audio.durationSec)
          : durationLabel(episode.estimatedMinutes)
      }</itunes:duration>
      <itunes:explicit>false</itunes:explicit>
      <itunes:episodeType>full</itunes:episodeType>
    </item>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(feedTitle)}</title>
    <link>${escapeXml(link)}</link>
    <description>${escapeXml(feedDescription)}</description>
    <language>ja</language>
    <lastBuildDate>${toRfc822(withAudio[0]?.createdAt)}</lastBuildDate>
    <itunes:author>${escapeXml(feedAuthor)}</itunes:author>
    <itunes:summary>${escapeXml(feedDescription)}</itunes:summary>
    <itunes:type>episodic</itunes:type>
    <itunes:explicit>false</itunes:explicit>
    <itunes:category text="Technology" />
    <itunes:image href="${escapeXml(image)}" />
    <image>
      <url>${escapeXml(image)}</url>
      <title>${escapeXml(feedTitle)}</title>
      <link>${escapeXml(link)}</link>
    </image>
${items}
  </channel>
</rss>
`;
}
