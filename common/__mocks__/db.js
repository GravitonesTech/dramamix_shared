const db = {
  query: jest.fn(),
};

const sequelize = {
  authenticate: jest.fn().mockResolvedValue(true),
  define: jest.fn(),
  sync: jest.fn().mockResolvedValue(true),
};

module.exports = { db, sequelize };
