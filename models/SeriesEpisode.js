const { DataTypes } = require('sequelize');
const { sequelize } = require('../common/sequelize');

const SeriesEpisode = sequelize.define('SeriesEpisode', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  series_id: { type: DataTypes.INTEGER },
  episode_number: { type: DataTypes.INTEGER },
  video_url: { type: DataTypes.STRING, allowNull: true },
  thumbnail_url: { type: DataTypes.STRING, allowNull: true },
  title: { type: DataTypes.STRING, allowNull: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  tags: { type: DataTypes.STRING, allowNull: true },
  coin: { type: DataTypes.INTEGER, defaultValue: 0 },
  is_deleted: { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
  tableName: 'series_episodes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = SeriesEpisode;
