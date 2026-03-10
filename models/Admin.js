const { DataTypes } = require('sequelize');
const { sequelize } = require('../common/sequelize');

const Admin = sequelize.define('Admin', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: true },
  email: { type: DataTypes.STRING },
  password: { type: DataTypes.STRING },
  phone: { type: DataTypes.STRING, allowNull: true },
  profile_image: { type: DataTypes.TEXT, allowNull: true },
  terms_and_conditions: { type: DataTypes.TEXT, allowNull: true },
  privacy_and_policy: { type: DataTypes.TEXT, allowNull: true },
  about_us: { type: DataTypes.TEXT, allowNull: true },
  contact_us: { type: DataTypes.TEXT, allowNull: true },
  login_type: { type: DataTypes.STRING, defaultValue: 'Guest' },
}, {
  tableName: 'admin',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Admin;
