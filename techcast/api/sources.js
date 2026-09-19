// GET /api/sources — カタログ、タグ、プリセット、配信まわりの状態を返す
import { SOURCES, PRESETS } from '../server/sources.js';
import { TAGS } from '../server/taxonomy.js';
import { GLOSSARY } from '../server/glossary.js';
import { createTtsProvider } from '../server/audio/tts.js';
import { listEpisodes } from '../server/audio/store.js';
import { resolveBaseUrl } from '../server/audio/base-url.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const provider = createTtsProvider();
  const baseUrl = resolveBaseUrl(req);

  let storedWithAudio = 0;
  try {
    const stored = await listEpisodes(undefined, 100);
    storedWithAudio = stored.filter((e) => e.audio?.file).length;
  } catch {
    storedWithAudio = 0;
  }

  res.status(200).json({
    sources: SOURCES,
    tags: TAGS,
    presets: PRESETS,
    glossarySize: GLOSSARY.length,
    claudeConfigured: Boolean(process.env.ANTHROPIC_API_KEY),
    podcast: {
      ttsProvider: provider ? provider.name : null,
      feedUrl: `${baseUrl}/api/podcast`,
      episodesWithAudio: storedWithAudio
    }
  });
}
