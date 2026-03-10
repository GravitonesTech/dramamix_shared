const { DataTypes } = require('sequelize');
const { sequelize } = require('../common/sequelize');

const License = sequelize.define('License', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  purchase_code: { type: DataTypes.STRING, allowNull: true },
  username: { type: DataTypes.STRING, allowNull: true },
  item_id: { type: DataTypes.STRING, allowNull: true },
  ip: { type: DataTypes.STRING, allowNull: true },
  referer: { type: DataTypes.TEXT, allowNull: true },
  install_path: { type: DataTypes.TEXT, allowNull: true },
  domain: { type: DataTypes.STRING, allowNull: true },
  type: { type: DataTypes.STRING, defaultValue: 'user' },
  verified_at: { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: 'licenses',
  timestamps: false,
});

module.exports = License;
