const { DataTypes } = require('sequelize');
const { sequelize } = require('../common/sequelize');

const EpisodeUnlocked = sequelize.define('EpisodeUnlocked', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER },
  series_id: { type: DataTypes.INTEGER },
  episode_id: { type: DataTypes.INTEGER },
  coin: { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
  tableName: 'episode_unlocked',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = EpisodeUnlocked;
