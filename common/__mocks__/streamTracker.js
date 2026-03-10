const trackViewer = jest.fn().mockResolvedValue(true);
const getEpisodeViewerCount = jest.fn().mockResolvedValue(42);
const getSeriesViewerCount = jest.fn().mockResolvedValue(100);

module.exports = { trackViewer, getEpisodeViewerCount, getSeriesViewerCount };
