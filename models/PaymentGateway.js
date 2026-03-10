const { DataTypes } = require('sequelize');
const { sequelize } = require('../common/sequelize');

const PaymentGateway = sequelize.define('PaymentGateway', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING },
  api_id: { type: DataTypes.STRING, allowNull: true },
  api_key: { type: DataTypes.STRING, allowNull: true },
  is_active: { type: DataTypes.INTEGER, defaultValue: 1 },
  is_deleted: { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
  tableName: 'payment_getways',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = PaymentGateway;
