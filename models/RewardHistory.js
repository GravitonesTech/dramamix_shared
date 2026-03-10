const { DataTypes } = require('sequelize');
const { sequelize } = require('../common/sequelize');

const RewardHistory = sequelize.define('RewardHistory', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER },
  title: { type: DataTypes.STRING },
  coin: { type: DataTypes.INTEGER, defaultValue: 0 },
  expired: { type: DataTypes.DATEONLY, allowNull: true },
  is_expired: { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
  tableName: 'reward_history',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = RewardHistory;
