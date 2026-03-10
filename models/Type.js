const { DataTypes } = require('sequelize');
const { sequelize } = require('../common/sequelize');

const Type = sequelize.define('Type', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  type_image: { type: DataTypes.STRING, allowNull: true },
  type_name: { type: DataTypes.STRING },
  is_deleted: { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
  tableName: 'types',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Type;
