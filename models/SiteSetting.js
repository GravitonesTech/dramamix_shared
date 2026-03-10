const { DataTypes } = require('sequelize');
const { sequelize } = require('../common/sequelize');

const SiteSetting = sequelize.define('SiteSetting', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING, allowNull: true },
  logo: { type: DataTypes.STRING, allowNull: true },
  favicon: { type: DataTypes.STRING, allowNull: true },
  firebase_json: { type: DataTypes.TEXT, allowNull: true },
  copyright_text: { type: DataTypes.STRING, allowNull: true },
  is_admin_maintenance: { type: DataTypes.INTEGER, defaultValue: 0 },
  is_website_maintenance: { type: DataTypes.INTEGER, defaultValue: 0 },
  is_inspect: { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
  tableName: 'site_settings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = SiteSetting;
