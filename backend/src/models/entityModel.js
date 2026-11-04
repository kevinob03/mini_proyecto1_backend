import pool from '../config/database.js';

export function createEntityModel(table, columns, searchableColumns = []) {
  const selectColumns = columns.map((column) => `e.${column}`).join(', ');
  const listJoins = table === 'productos'
    ? ' LEFT JOIN categorias c ON c.id = e.categoria_id LEFT JOIN proveedores p ON p.id = e.proveedor_id'
    : '';
  const listExtra = table === 'productos' ? ', c.nombre AS categoria_nombre, p.nombre AS proveedor_nombre' : '';

  return {
    async findAll(search) {
      const where = search && searchableColumns.length
        ? ` WHERE (${searchableColumns.map((column) => `e.${column} LIKE ?`).join(' OR ')})`
        : '';
      const params = where ? searchableColumns.map(() => `%${search}%`) : [];
      const [rows] = await pool.execute(
        `SELECT ${selectColumns}${listExtra} FROM ${table} e${listJoins}${where} ORDER BY e.id DESC`,
        params,
      );
      return rows;
    },
    async findById(id) {
      const [rows] = await pool.execute(`SELECT ${columns.join(', ')} FROM ${table} WHERE id = ?`, [id]);
      return rows[0] || null;
    },
    async create(data) {
      const names = Object.keys(data);
      const [result] = await pool.execute(
        `INSERT INTO ${table} (${names.join(', ')}) VALUES (${names.map(() => '?').join(', ')})`,
        names.map((name) => data[name]),
      );
      return this.findById(result.insertId);
    },
    async update(id, data) {
      const names = Object.keys(data);
      const [result] = await pool.execute(
        `UPDATE ${table} SET ${names.map((name) => `${name} = ?`).join(', ')} WHERE id = ?`,
        [...names.map((name) => data[name]), id],
      );
      return result.affectedRows ? this.findById(id) : null;
    },
    async remove(id) {
      const [result] = await pool.execute(`DELETE FROM ${table} WHERE id = ?`, [id]);
      return result.affectedRows > 0;
    },
  };
}
