const { DataTypes } = require('sequelize');
const { sequelize } = require('../common/sequelize');

const ReportReason = sequelize.define('ReportReason', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  reason_title: { type: DataTypes.STRING },
  is_active: { type: DataTypes.INTEGER, defaultValue: 1 },
  is_deleted: { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
  tableName: 'report_reasons',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = ReportReason;
