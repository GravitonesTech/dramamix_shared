const { DataTypes } = require('sequelize');
const { sequelize } = require('../common/sequelize');

const Language = sequelize.define('Language', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING },
  is_deleted: { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
  tableName: 'languages',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Language;
