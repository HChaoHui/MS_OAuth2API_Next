const pool = require('../utils/db');

// 验证表名是否合法（防止SQL注入）
const validateTableName = (tableName) => {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]{0,63}$/.test(tableName)) {
    throw new Error('Invalid table name');
  }
  return tableName;
};

// 验证字段名是否合法
const validateFieldName = (fieldNames) => {
  const regex = /^[a-zA-Z_][a-zA-Z0-9_]{0,63}$/;
  if (Array.isArray(fieldNames)) {
    return fieldNames.every(name => regex.test(name));
  }
  return regex.test(fieldNames);
};

class BaseService {
  constructor(tableName) {
    this.tableName = validateTableName(tableName);
  }

  /**
   * 安全的SQL查询方法
   * @param {string} sql - 带占位符的SQL语句
   * @param {Array} params - 参数数组
   * @returns {Promise<Array>} 查询结果
   */
  async query(sql, params = []) {
    try {
      const [rows] = await pool.query(sql, params);
      return rows;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  /**
   * 查询表中所有记录
   * @param {Array} fields - 要查询的字段数组（可选）
   * @returns {Promise<Array>} 查询结果
   */
  async findAll(fields = ['*']) {
    if (!validateFieldName(fields) && fields[0] !== '*') {
      throw new Error('Invalid field names'); 
    }
    const fieldList = fields.join(', ');
    return this.query(`SELECT ${fieldList} FROM ??`, [this.tableName]);
  }

  /**
   * 根据ID查询单条记录
   * @param {number|string} id - 记录ID
   * @param {Array} fields - 要查询的字段数组（可选）
   * @returns {Promise<Object|null>} 查询结果
   */
  async findById(id, fields = ['*']) {
    if (!validateFieldName(fields) && fields[0] !== '*') {
      throw new Error('Invalid field names');
    }
    const fieldList = fields.join(', ');
    const [rows] = await pool.query(
      `SELECT ${fieldList} FROM ?? WHERE id = ? LIMIT 1`,
      [this.tableName, id]
    );
    return rows[0] || null;
  }

  /**
   * 创建记录
   * @param {Object} data - 要插入的数据对象
   * @returns {Promise<number>} 新创建的记录ID
   */
  async create(data) {
    const fields = Object.keys(data);
    if (!validateFieldName(fields)) {
      throw new Error('Invalid field names');
    }
    
    const values = fields.map(field => data[field]);
    const placeholders = fields.map(() => '?').join(', ');
    
    const [result] = await pool.query(
      `INSERT INTO ?? (??) VALUES (${placeholders})`,
      [this.tableName, fields, ...values]
    );
    
    return result.insertId;
  }

  /**
   * 更新记录
   * @param {number|string} id - 记录ID
   * @param {Object} data - 要更新的数据对象
   * @returns {Promise<boolean>} 是否更新成功
   */
  async update(id, data) {
    const fields = Object.keys(data);
    if (!validateFieldName(fields)) {
      throw new Error('Invalid field names');
    }
    
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => data[field]);
    
    const [result] = await pool.query(
      `UPDATE ?? SET ${setClause} WHERE id = ?`,
      [this.tableName, ...values, id]
    );
    
    return result.affectedRows > 0;
  }

  /**
   * 删除记录
   * @param {number|string} id - 记录ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  async delete(id) {
    const [result] = await pool.query(
      'DELETE FROM ?? WHERE id = ?',
      [this.tableName, id]
    );
    return result.affectedRows > 0;
  }

  /**
   * 条件查询
   * @param {Object} conditions - 查询条件对象 { field: value }
   * @param {Object} options - 查询选项 { fields, limit, offset, orderBy }
   * @returns {Promise<Array>} 查询结果
   */
  async find(conditions = {}, options = {}) {
    const {
      fields = ['*'],
      limit = 1000,
      offset = 0,
      orderBy = 'id ASC'
    } = options;
    
    if (!validateFieldName(fields) && fields[0] !== '*') {
      throw new Error('Invalid field names');
    }
    
    const conditionFields = Object.keys(conditions);
    if (!validateFieldName(conditionFields)) {
      throw new Error('Invalid condition field names');
    }
    
    const fieldList = fields.join(', ');
    let whereClause = '1 = 1';
    const values = [];
    
    if (conditionFields.length > 0) {
      whereClause = conditionFields.map(field => {
        values.push(conditions[field]);
        return `${field} = ?`;
      }).join(' AND ');
    }
    
    // 验证 orderBy
    const orderByParts = orderBy.split(' ');
    if (orderByParts.length > 2 || (orderByParts[1] && !['ASC', 'DESC'].includes(orderByParts[1].toUpperCase()))) {
      throw new Error('Invalid orderBy parameter');
    }
    
    const sql = `
      SELECT ${fieldList} FROM ?? 
      WHERE ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;
    
    return this.query(sql, [this.tableName, ...values, limit, offset]);
  }

  /**
   * 计数
   * @param {Object} conditions - 查询条件对象（可选）
   * @returns {Promise<number>} 记录数量
   */
  async count(conditions = {}) {
    const conditionFields = Object.keys(conditions);
    if (conditionFields.length > 0 && !validateFieldName(conditionFields)) {
      throw new Error('Invalid condition field names');
    }
    
    let whereClause = '1 = 1';
    const values = [];
    
    if (conditionFields.length > 0) {
      whereClause = conditionFields.map(field => {
        values.push(conditions[field]);
        return `${field} = ?`;
      }).join(' AND ');
    }
    
    const [result] = await pool.query(
      `SELECT COUNT(*) AS count FROM ?? WHERE ${whereClause}`,
      [this.tableName, ...values]
    );
    
    return result[0].count;
  }

  /**
   * 判断记录是否存在
   * @param {Object} conditions - 查询条件对象
   * @returns {Promise<boolean>} 是否存在
   */
  async exists(conditions) {
    const count = await this.count(conditions);
    return count > 0;
  }

  /**
   * 在事务中执行操作
   * @param {Function} callback - 包含事务操作的异步函数
   * @returns {Promise} 事务结果
   */
  async transaction(callback) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = BaseService;