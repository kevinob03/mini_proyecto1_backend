import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pool from './config/database.js';
import productRoutes from './routes/productRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import supplierRoutes from './routes/supplierRoutes.js';
import imageRoutes from './routes/imageRoutes.js';
import authRoutes from './routes/authRoutes.js';
import authMiddleware from './middlewares/authMiddleware.js';

const jwtSecret = process.env.JWT_SECRET || '';
if (Buffer.byteLength(jwtSecret, 'utf8') < 32 || new Set(jwtSecret).size < 12 || /change.?me|example|placeholder|your.?secret|password|secret123/i.test(jwtSecret)) {
  throw new Error('Configuración insegura: define JWT_SECRET aleatorio de al menos 32 bytes en backend/.env.');
}

const app = express();
const allowedOrigins = new Set([process.env.FRONTEND_URL || 'http://localhost:5173', 'http://127.0.0.1:5173']);
app.use(cors({ origin: (origin, callback) => callback(null, !origin || allowedOrigins.has(origin)) }));
app.use(express.json({ limit: '100kb' }));
app.get('/api/health', async (_req, res) => {
  try { await pool.query('SELECT 1'); res.json({ status: 'ok', database: 'connected' }); }
  catch { res.status(503).json({ status: 'error', database: 'unavailable' }); }
});
app.use('/api/auth', authRoutes);
app.use('/api/productos', authMiddleware, productRoutes);
app.use('/api/categorias', authMiddleware, categoryRoutes);
app.use('/api/proveedores', authMiddleware, supplierRoutes);
app.use('/api/imagenes', authMiddleware, imageRoutes);
app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));
app.use((error, _req, res, _next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) return res.status(400).json({ error: 'El cuerpo JSON no es válido.' });
  if (error.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ error: 'La categoría o el proveedor indicado no existe.' });
  if (error.code === 'ER_ROW_IS_REFERENCED_2') return res.status(409).json({ error: 'No se puede eliminar: hay productos relacionados.' });
  if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Ya existe un registro con ese valor.' });
  console.error(error);
  return res.status(500).json({ error: 'Error interno del servidor.' });
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`API de inventario disponible en http://localhost:${port}`));
