const express = require('express');
const router = express.Router();
const aiController = require('../components/ai_controller');

const checkAuth = require('../services/checkauth');
const { check } = require('express-validator');

router.use(checkAuth);

router.post('/', async (req, res) => {
    
    const message = req.body.message;
    // console.log(message);return;
    const reply = await aiController.run(message);
    // console.log(reply.text());

    res.json({ reply: reply.text() });
});

module.exports = router;