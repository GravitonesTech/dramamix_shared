const { DataTypes } = require('sequelize');
const { sequelize } = require('../common/sequelize');

const Plan = sequelize.define('Plan', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: true },
  google_play_id: { type: DataTypes.STRING, allowNull: true },
  is_unlimited: { type: DataTypes.INTEGER, defaultValue: 0 },
  is_weekly: { type: DataTypes.INTEGER, defaultValue: 0 },
  is_yearly: { type: DataTypes.INTEGER, defaultValue: 0 },
  coin: { type: DataTypes.STRING, allowNull: true },
  extra_coin: { type: DataTypes.STRING, allowNull: true },
  amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  discount_percentage: { type: DataTypes.DECIMAL(10, 0), allowNull: true },
  is_limited_time: { type: DataTypes.INTEGER, defaultValue: 0 },
  description: { type: DataTypes.TEXT, allowNull: true },
  is_active: { type: DataTypes.INTEGER, defaultValue: 1 },
  is_deleted: { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
  tableName: 'plans',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Plan;
