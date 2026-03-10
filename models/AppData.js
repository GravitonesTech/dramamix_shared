const { DataTypes } = require('sequelize');
const { sequelize } = require('../common/sequelize');

const AppData = sequelize.define('AppData', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  daily_watch_maximum_ads: { type: DataTypes.INTEGER, defaultValue: 0 },
  daily_watch_ads_for_minimum_coin: { type: DataTypes.INTEGER, defaultValue: 0 },
  daily_watch_ads_for_maximum_coin: { type: DataTypes.INTEGER, defaultValue: 0 },
  extra_daily: { type: DataTypes.INTEGER, defaultValue: 0 },
  watch_ads_for_episode: { type: DataTypes.INTEGER, defaultValue: 0 },
  how_many_episode_watch_after_ads: { type: DataTypes.INTEGER, defaultValue: 3 },
  time_after_watch_ads: { type: DataTypes.STRING, allowNull: true },
  time_after_watch_daily_ads: { type: DataTypes.STRING, allowNull: true },
  time_between_daily_ads: { type: DataTypes.STRING, allowNull: true },
  per_episode_coin: { type: DataTypes.INTEGER, defaultValue: 0 },
  day_1_coin: { type: DataTypes.INTEGER, defaultValue: 0 },
  day_2_coin: { type: DataTypes.INTEGER, defaultValue: 0 },
  day_3_coin: { type: DataTypes.INTEGER, defaultValue: 0 },
  day_4_coin: { type: DataTypes.INTEGER, defaultValue: 0 },
  day_5_coin: { type: DataTypes.INTEGER, defaultValue: 0 },
  day_6_coin: { type: DataTypes.INTEGER, defaultValue: 0 },
  day_7_coin: { type: DataTypes.INTEGER, defaultValue: 0 },
  login_reward_coin: { type: DataTypes.INTEGER, defaultValue: 0 },
  turn_on_notification_coin: { type: DataTypes.INTEGER, defaultValue: 0 },
  bind_email_coin: { type: DataTypes.INTEGER, defaultValue: 0 },
  link_whatsapp_coin: { type: DataTypes.INTEGER, defaultValue: 0 },
  follow_us_on_facebook_coin: { type: DataTypes.INTEGER, defaultValue: 0 },
  follow_us_on_youtube_coin: { type: DataTypes.INTEGER, defaultValue: 0 },
  follow_us_on_instagram_coin: { type: DataTypes.INTEGER, defaultValue: 0 },
  country: { type: DataTypes.TEXT, allowNull: true },
  currency: { type: DataTypes.TEXT, allowNull: true },
  currency_symbol: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: 'app_data',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = AppData;
