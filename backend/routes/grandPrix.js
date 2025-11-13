const express = require('express');
const router = express.Router();

// Временные маршруты для Grand Prix - можно будет расширить позже
router.get('/', (req, res) => {
  res.json({ 
    message: 'Grand Prix routes are working',
    endpoints: [
      '/api/grand-prix/ - Get all grand prix',
      '/api/grand-prix/:id - Get specific grand prix'
    ]
  });
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  res.json({ 
    message: `Grand Prix ${id} details`,
    id: id,
    data: 'Grand prix data will be implemented later'
  });
});

module.exports = router;