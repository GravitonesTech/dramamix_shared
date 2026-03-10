const { sequelize } = require('../common/sequelize');
const User = require('./User');
const Admin = require('./Admin');
const Series = require('./Series');
const SeriesEpisode = require('./SeriesEpisode');
const Category = require('./Category');
const Tag = require('./Tag');
const Type = require('./Type');
const Language = require('./Language');
const Plan = require('./Plan');
const PaymentGateway = require('./PaymentGateway');
const UserPayment = require('./UserPayment');
const UserWatchedSeries = require('./UserWatchedSeries');
const UserLikedEpisode = require('./UserLikedEpisode');
const UserFavouriteEpisode = require('./UserFavouriteEpisode');
const EpisodeUnlocked = require('./EpisodeUnlocked');
const RewardHistory = require('./RewardHistory');
const UserReported = require('./UserReported');
const ReportReason = require('./ReportReason');
const Faq = require('./Faq');
const AppData = require('./AppData');
const Advertisement = require('./Advertisement');
const SiteSetting = require('./SiteSetting');
const License = require('./License');
const AboutUs = require('./AboutUs');
const VideoAccessToken = require('./VideoAccessToken');

Series.belongsTo(Type, { foreignKey: 'type_id', as: 'type' });
Series.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });
Type.hasMany(Series, { foreignKey: 'type_id' });
Category.hasMany(Series, { foreignKey: 'category_id' });

SeriesEpisode.belongsTo(Series, { foreignKey: 'series_id', as: 'series' });
Series.hasMany(SeriesEpisode, { foreignKey: 'series_id', as: 'episodes' });

User.belongsTo(Language, { foreignKey: 'language_id', as: 'language' });
Language.hasMany(User, { foreignKey: 'language_id' });

UserPayment.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
UserPayment.belongsTo(Plan, { foreignKey: 'plan_id', as: 'plan' });
UserPayment.belongsTo(PaymentGateway, { foreignKey: 'payment_getway_id', as: 'gateway' });
User.hasMany(UserPayment, { foreignKey: 'user_id', as: 'payments' });

UserWatchedSeries.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
UserWatchedSeries.belongsTo(Series, { foreignKey: 'series_id', as: 'series' });
User.hasMany(UserWatchedSeries, { foreignKey: 'user_id', as: 'watchedSeries' });
Series.hasMany(UserWatchedSeries, { foreignKey: 'series_id' });

UserLikedEpisode.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
UserLikedEpisode.belongsTo(Series, { foreignKey: 'series_id', as: 'series' });
User.hasMany(UserLikedEpisode, { foreignKey: 'user_id', as: 'likedEpisodes' });

UserFavouriteEpisode.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
UserFavouriteEpisode.belongsTo(Series, { foreignKey: 'series_id', as: 'series' });
User.hasMany(UserFavouriteEpisode, { foreignKey: 'user_id', as: 'favouriteEpisodes' });

EpisodeUnlocked.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
EpisodeUnlocked.belongsTo(Series, { foreignKey: 'series_id', as: 'series' });
User.hasMany(EpisodeUnlocked, { foreignKey: 'user_id', as: 'unlockedEpisodes' });

RewardHistory.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(RewardHistory, { foreignKey: 'user_id', as: 'rewardHistory' });

const initDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL connection established successfully.');
    await sequelize.sync({ force: false });
    console.log('All models synchronized with database.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
};

module.exports = {
  sequelize,
  User,
  Admin,
  Series,
  SeriesEpisode,
  Category,
  Tag,
  Type,
  Language,
  Plan,
  PaymentGateway,
  UserPayment,
  UserWatchedSeries,
  UserLikedEpisode,
  UserFavouriteEpisode,
  EpisodeUnlocked,
  RewardHistory,
  UserReported,
  ReportReason,
  Faq,
  AppData,
  Advertisement,
  SiteSetting,
  License,
  AboutUs,
  VideoAccessToken,
  initDatabase,
};
