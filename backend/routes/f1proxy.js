const express = require('express');
const router = express.Router();
const axios = require('axios');

// Прокси для всех F1 API запросов
router.get('*', async (req, res) => {
  try {
    const originalUrl = req.originalUrl.replace('/api/f1-proxy', '');
    const targetUrl = `https://api.jolpi.ca/ergast/f1${originalUrl}`;
    
    console.log(`🔄 Прокси: ${req.originalUrl} -> ${targetUrl}`);
    
    const response = await axios.get(targetUrl, {
      timeout: 10000
    });
    
    console.log('✅ Прокси успешно');
    res.json(response.data);
    
  } catch (error) {
    console.error('❌ Прокси ошибка:', error.message);
    res.status(500).json({ 
      error: 'Proxy error',
      message: error.message 
    });
  }
});

module.exports = router;