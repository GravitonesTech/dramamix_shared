const { DataTypes } = require('sequelize');
const { sequelize } = require('../common/sequelize');

const VideoAccessToken = sequelize.define('VideoAccessToken', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  token: { type: DataTypes.TEXT },
  user_id: { type: DataTypes.INTEGER },
  episode_id: { type: DataTypes.INTEGER },
  series_id: { type: DataTypes.INTEGER },
  ip_address: { type: DataTypes.STRING(45), allowNull: true },
  device_id: { type: DataTypes.STRING(100), allowNull: true },
  access_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  is_revoked: { type: DataTypes.INTEGER, defaultValue: 0 },
  expires_at: { type: DataTypes.DATE },
  last_accessed_at: { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: 'video_access_tokens',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = VideoAccessToken;
