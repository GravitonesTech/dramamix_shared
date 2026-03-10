const { DataTypes } = require('sequelize');
const { sequelize } = require('../common/sequelize');

const UserFavouriteEpisode = sequelize.define('UserFavouriteEpisode', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER },
  series_id: { type: DataTypes.INTEGER },
  episode_id: { type: DataTypes.INTEGER, allowNull: true },
}, {
  tableName: 'users_favourite_episode',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = UserFavouriteEpisode;
