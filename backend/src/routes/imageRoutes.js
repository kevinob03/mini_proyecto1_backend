import { Router } from 'express';
import { searchImages, trackImageSelection } from '../controllers/imageController.js';

const router = Router();
router.get('/buscar', searchImages);
router.post('/seleccionar', trackImageSelection);
export default router;
