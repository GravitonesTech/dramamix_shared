const { DataTypes } = require('sequelize');
const { sequelize } = require('../common/sequelize');

const Advertisement = sequelize.define('Advertisement', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  ad_platform_name: { type: DataTypes.STRING, allowNull: true },
  ad_platform_image: { type: DataTypes.STRING, allowNull: true },
  ad_publisher_id: { type: DataTypes.STRING, allowNull: true },
  ad_banner_status: { type: DataTypes.INTEGER, defaultValue: 0 },
  ad_banner_id: { type: DataTypes.TEXT, allowNull: true },
  ad_banner_id_ios: { type: DataTypes.TEXT, allowNull: true },
  ad_banner_remarks: { type: DataTypes.TEXT, allowNull: true },
  ad_interstitial_status: { type: DataTypes.INTEGER, defaultValue: 0 },
  ad_interstitial_id: { type: DataTypes.TEXT, allowNull: true },
  ad_interstitial_id_ios: { type: DataTypes.TEXT, allowNull: true },
  ad_interstitial_clicks: { type: DataTypes.INTEGER, defaultValue: 0 },
  ad_interstitial_remarks: { type: DataTypes.TEXT, allowNull: true },
  ad_native_status: { type: DataTypes.INTEGER, defaultValue: 0 },
  ad_native_id: { type: DataTypes.TEXT, allowNull: true },
  ad_native_id_ios: { type: DataTypes.TEXT, allowNull: true },
  ad_native_remarks: { type: DataTypes.TEXT, allowNull: true },
  ad_reward_status: { type: DataTypes.INTEGER, defaultValue: 0 },
  ad_reward_id: { type: DataTypes.TEXT, allowNull: true },
  ad_reward_id_ios: { type: DataTypes.TEXT, allowNull: true },
  ad_reward_remarks: { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
  tableName: 'advertisement',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Advertisement;
