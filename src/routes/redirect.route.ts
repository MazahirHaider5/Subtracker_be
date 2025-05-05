import { Router } from 'express';

const router = Router();

router.get('/success', (req, res) => {
  // Flutter custom scheme URL
  res.redirect('myapp://success');
});

router.get('/cancel', (req, res) => {
  res.redirect('myapp://cancel');
});

export default router;
