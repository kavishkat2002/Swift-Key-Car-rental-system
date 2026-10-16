import { Router, Request, Response } from 'express';
import db from '../db/db.js';

const router = Router();

// GET /api/blog - List Sri Lanka Road Trips and Driving Guides
router.get('/', (_req: Request, res: Response): void => {
  try {
    const posts = db.prepare(`
      SELECT id, title, slug, excerpt, cover_image, category, author_name, read_time_minutes, published_at
      FROM blog_posts
      ORDER BY published_at DESC
    `).all();

    res.json({ success: true, posts });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to load blog guides.' });
  }
});

// GET /api/blog/:slug - Single Post
router.get('/:slug', (req: Request, res: Response): void => {
  try {
    const post = db.prepare('SELECT * FROM blog_posts WHERE slug = ?').get(req.params.slug);

    if (!post) {
      res.status(404).json({ success: false, error: 'Article not found.' });
      return;
    }

    res.json({ success: true, post });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to load article details.' });
  }
});

export default router;
