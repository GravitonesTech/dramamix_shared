const { DataTypes } = require('sequelize');
const { sequelize } = require('../common/sequelize');

const Category = sequelize.define('Category', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING },
  is_deleted: { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
  tableName: 'categories',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Category;
