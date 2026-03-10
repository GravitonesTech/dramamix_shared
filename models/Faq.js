const { DataTypes } = require('sequelize');
const { sequelize } = require('../common/sequelize');

const Faq = sequelize.define('Faq', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  question: { type: DataTypes.TEXT },
  answer: { type: DataTypes.TEXT },
}, {
  tableName: 'faqs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Faq;
