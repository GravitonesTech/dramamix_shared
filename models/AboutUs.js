const { DataTypes } = require('sequelize');
const { sequelize } = require('../common/sequelize');

const AboutUs = sequelize.define('AboutUs', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  highlight: { type: DataTypes.TEXT, allowNull: true },
  mobile_number: { type: DataTypes.STRING(20), allowNull: true },
  email: { type: DataTypes.STRING, allowNull: true },
  official_website: { type: DataTypes.STRING, allowNull: true },
  follow_us_on_instagram: { type: DataTypes.STRING, allowNull: true },
  follow_us_in_facebook: { type: DataTypes.STRING, allowNull: true },
  follow_us_in_youtube: { type: DataTypes.STRING, allowNull: true },
  follow_us_in_whatsapp_channel: { type: DataTypes.STRING, allowNull: true },
}, {
  tableName: 'about_us',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = AboutUs;
