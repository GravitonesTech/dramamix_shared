const { safeSadd, safeScard, safeSrem, safeSmembers, safeExpire, safeSet, safeGet } = require('./redis');

const STREAM_KEY_PREFIX = 'stream:active';
const VIEWER_TTL = 180;

async function trackViewer(episodeId, seriesId, userId) {
  const episodeKey = `${STREAM_KEY_PREFIX}:ep:${episodeId}`;
  const seriesKey = `${STREAM_KEY_PREFIX}:series:${seriesId}`;
  const viewerKey = `${STREAM_KEY_PREFIX}:viewer:${userId}:${episodeId}`;

  await safeSadd(episodeKey, String(userId));
  await safeExpire(episodeKey, VIEWER_TTL);

  await safeSadd(seriesKey, String(userId));
  await safeExpire(seriesKey, VIEWER_TTL);

  await safeSet(viewerKey, JSON.stringify({
    episodeId,
    seriesId,
    lastSeen: Date.now(),
  }), { ex: VIEWER_TTL });
}

async function removeViewer(episodeId, seriesId, userId) {
  const episodeKey = `${STREAM_KEY_PREFIX}:ep:${episodeId}`;
  const seriesKey = `${STREAM_KEY_PREFIX}:series:${seriesId}`;
  const viewerKey = `${STREAM_KEY_PREFIX}:viewer:${userId}:${episodeId}`;

  await safeSrem(episodeKey, String(userId));
  await safeSrem(seriesKey, String(userId));
  const { safeDel } = require('./redis');
  await safeDel(viewerKey);
}

async function getEpisodeViewerCount(episodeId) {
  const key = `${STREAM_KEY_PREFIX}:ep:${episodeId}`;
  return await safeScard(key);
}

async function getSeriesViewerCount(seriesId) {
  const key = `${STREAM_KEY_PREFIX}:series:${seriesId}`;
  return await safeScard(key);
}

async function getEpisodeViewers(episodeId) {
  const key = `${STREAM_KEY_PREFIX}:ep:${episodeId}`;
  return await safeSmembers(key);
}

async function getActiveStreams() {
  return {
    message: 'Use getEpisodeViewerCount or getSeriesViewerCount with specific IDs',
  };
}

module.exports = {
  trackViewer,
  removeViewer,
  getEpisodeViewerCount,
  getSeriesViewerCount,
  getEpisodeViewers,
  getActiveStreams,
};
