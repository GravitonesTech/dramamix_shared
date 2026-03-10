const { DataTypes } = require('sequelize');
const { sequelize } = require('../common/sequelize');

const UserWatchedSeries = sequelize.define('UserWatchedSeries', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER },
  series_id: { type: DataTypes.INTEGER },
  last_viewed_episode: { type: DataTypes.INTEGER, defaultValue: 0 },
  last_unlocked_episode: { type: DataTypes.INTEGER, defaultValue: 0 },
  watched_ads_for_episode: { type: DataTypes.INTEGER, defaultValue: 0 },
  last_watched_ads_date: { type: DataTypes.DATE, allowNull: true },
  is_added_list: { type: DataTypes.INTEGER, defaultValue: 0 },
  is_auto_unlocked: { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
  tableName: 'users_watched_series',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = UserWatchedSeries;
