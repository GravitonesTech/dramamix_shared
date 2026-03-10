const { v4: uuidv4 } = require("uuid");
const { sequelizeWrite, sequelizeRead } = require('./sequelize');
const { QueryTypes } = require('sequelize');

function addTimestampsToInsert(sql, params) {
  const insertMatch = sql.match(/INSERT\s+INTO\s+\S+\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i);
  if (!insertMatch) return { sql, params };

  const columns = insertMatch[1];
  const values = insertMatch[2];

  if (/created_at|updated_at/i.test(columns)) return { sql, params };

  const newColumns = columns.trim() + ', created_at, updated_at';
  const newValues = values.trim() + ', NOW(), NOW()';

  const newSql = sql.replace(insertMatch[0],
    `INSERT INTO ${sql.match(/INSERT\s+INTO\s+(\S+)/i)[1]} (${newColumns}) VALUES (${newValues})`);

  return { sql: newSql, params };
}

function mysqlToPostgres(sql) {
  let pgSql = sql;

  let paramIndex = 0;
  pgSql = pgSql.replace(/\?/g, () => `$${++paramIndex}`);

  pgSql = pgSql.replace(/IFNULL\s*\(/gi, 'COALESCE(');

  pgSql = pgSql.replace(/GROUP_CONCAT\s*\(\s*(.+?)\s+SEPARATOR\s+'([^']+)'\s*\)/gi, "STRING_AGG($1, '$2')");
  pgSql = pgSql.replace(/GROUP_CONCAT\s*\(\s*(.+?)\s*\)/gi, "STRING_AGG($1::TEXT, ',')");

  pgSql = pgSql.replace(/FIND_IN_SET\s*\(\s*([^,]+?)\s*,\s*([^)]+?)\s*\)/gi,
    "($1::TEXT = ANY(STRING_TO_ARRAY($2, ',')))");

  pgSql = pgSql.replace(/DATE_FORMAT\s*\(\s*([^,]+?)\s*,\s*'%Y-%m'\s*\)/gi, "TO_CHAR($1, 'YYYY-MM')");
  pgSql = pgSql.replace(/DATE_FORMAT\s*\(\s*([^,]+?)\s*,\s*'%x-W%v'\s*\)/gi, "TO_CHAR($1, 'IYYY-\"W\"IW')");
  pgSql = pgSql.replace(/DATE_FORMAT\s*\(\s*DATE_SUB\s*\(\s*CURDATE\(\)\s*,\s*INTERVAL\s+(\w+)\s+MONTH\s*\)\s*,\s*'%Y-%m'\s*\)/gi,
    "TO_CHAR(CURRENT_DATE - INTERVAL '$1 months', 'YYYY-MM')");
  pgSql = pgSql.replace(/DATE_FORMAT\s*\(\s*DATE_SUB\s*\(\s*CURDATE\(\)\s*,\s*INTERVAL\s+(\w+)\s+WEEK\s*\)\s*,\s*'%x-W%v'\s*\)/gi,
    "TO_CHAR(CURRENT_DATE - INTERVAL '$1 weeks', 'IYYY-\"W\"IW')");

  pgSql = pgSql.replace(/CURDATE\s*\(\)/gi, 'CURRENT_DATE');

  pgSql = pgSql.replace(/DATE_SUB\s*\(\s*CURRENT_DATE\s*,\s*INTERVAL\s+(\w+)\s+(\w+)\s*\)/gi,
    "CURRENT_DATE - INTERVAL '$1 $2'");
  pgSql = pgSql.replace(/DATE_SUB\s*\(\s*([^,]+?)\s*,\s*INTERVAL\s+(\w+)\s+(\w+)\s*\)/gi,
    "$1 - INTERVAL '$2 $3'");

  pgSql = pgSql.replace(/DATE\s*\(\s*([^)]+?)\s*\)/gi, function(match, inner) {
    if (inner.includes('CURRENT_DATE') || inner.includes('INTERVAL')) {
      return `(${inner})::DATE`;
    }
    return `(${inner})::DATE`;
  });

  pgSql = pgSql.replace(/\bRAND\s*\(\)/gi, 'RANDOM()');

  pgSql = pgSql.replace(/\(\s*status\s*=\s*(\$\d+)\s*\|\|\s*status\s*=\s*(\$\d+)\s*\)/gi,
    '(status = $1 OR status = $2)');
  pgSql = pgSql.replace(/\b(\w+)\s*=\s*(\$\d+)\s*\|\|\s*(\w+)\s*=\s*(\$\d+)/gi,
    '$1 = $2 OR $3 = $4');

  pgSql = pgSql.replace(/\bORDER\s+BY\s+\?\?/gi, 'ORDER BY id');

  pgSql = pgSql.replace(/`/g, '"');

  return pgSql;
}

const db = {
  query: async (sql, replacements = []) => {
    let pgSql = mysqlToPostgres(sql);
    const isSelect = pgSql.trim().toUpperCase().startsWith('SELECT');
    const isInsert = pgSql.trim().toUpperCase().startsWith('INSERT');

    if (isInsert) {
      const ts = addTimestampsToInsert(pgSql, replacements);
      pgSql = ts.sql;
      replacements = ts.params;
    }

    if (isInsert && !/RETURNING/i.test(pgSql)) {
      pgSql = pgSql.replace(/;?\s*$/, ' RETURNING *');
    }

    const conn = isSelect ? sequelizeRead : sequelizeWrite;

    try {
      if (isSelect) {
        const results = await conn.query(pgSql, {
          bind: replacements,
          type: QueryTypes.SELECT,
          raw: true,
        });
        return [results];
      } else if (isInsert) {
        const [results] = await conn.query(pgSql, {
          bind: replacements,
          raw: true,
        });
        const insertId = results && results[0] ? results[0].id : null;
        return [{ insertId, affectedRows: results.length }, results.length];
      } else {
        const [results, metadata] = await conn.query(pgSql, {
          bind: replacements,
          raw: true,
        });
        return [{ affectedRows: metadata || 0 }, metadata || 0];
      }
    } catch (error) {
      console.error('Query error:', error.message);
      console.error('Original SQL:', sql);
      console.error('Converted SQL:', pgSql);
      console.error('Params:', replacements);
      throw error;
    }
  }
};

module.exports = { db, uuidv4 };
