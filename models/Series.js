const { DataTypes } = require('sequelize');
const { sequelize } = require('../common/sequelize');

const Series = sequelize.define('Series', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING },
  description: { type: DataTypes.TEXT, allowNull: true },
  thumbnail: { type: DataTypes.STRING, allowNull: true },
  poster: { type: DataTypes.STRING, allowNull: true },
  cover_video: { type: DataTypes.STRING, allowNull: true },
  category_id: { type: DataTypes.INTEGER, allowNull: true },
  type_id: { type: DataTypes.INTEGER, allowNull: true },
  tag_id: { type: DataTypes.STRING, allowNull: true },
  total_episode: { type: DataTypes.INTEGER, defaultValue: 0 },
  free_episodes: { type: DataTypes.INTEGER, defaultValue: 0 },
  is_free: { type: DataTypes.INTEGER, defaultValue: 0 },
  views: { type: DataTypes.INTEGER, defaultValue: 0 },
  likes: { type: DataTypes.INTEGER, defaultValue: 0 },
  favourites: { type: DataTypes.INTEGER, defaultValue: 0 },
  is_recommended: { type: DataTypes.INTEGER, defaultValue: 0 },
  is_active: { type: DataTypes.INTEGER, defaultValue: 1 },
  is_deleted: { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
  tableName: 'series',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Series;
