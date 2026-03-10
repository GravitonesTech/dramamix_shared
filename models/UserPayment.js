const { DataTypes } = require('sequelize');
const { sequelize } = require('../common/sequelize');

const UserPayment = sequelize.define('UserPayment', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER },
  transaction_id: { type: DataTypes.STRING },
  plan_id: { type: DataTypes.INTEGER, allowNull: true },
  payment_getway_id: { type: DataTypes.INTEGER, allowNull: true },
  transaction_key: { type: DataTypes.TEXT, allowNull: true },
  amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  status: { type: DataTypes.INTEGER, defaultValue: 1 },
  expire_date: { type: DataTypes.DATE, allowNull: true },
  currency: { type: DataTypes.STRING, allowNull: true },
}, {
  tableName: 'users_payments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = UserPayment;
