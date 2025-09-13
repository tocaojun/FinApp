import { Router } from 'express';

const router = Router();

// 临时路由，后续会完善
router.get('/', (req, res) => {
  res.json({ message: 'Reports route working' });
});

export { router as reportsRouter };