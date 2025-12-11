const express = require('express');
const router = express.Router();
const historyService = require('../services/historyService');

router.get('/', (req, res) => {
  try {
    const histories = historyService.getAll();
    res.json({ success: true, data: histories });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const history = historyService.add(req.body);
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    historyService.delete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/', (req, res) => {
  try {
    historyService.clearAll();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
