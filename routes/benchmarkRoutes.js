const express = require('express');
const router = express.Router();

const{benchmark,homepage} = require('../controllers/benckmarkController')
router.route('/api').post(benchmark) 
router.route('/').get(homepage)
//http://localhost:5001/
module.exports = router;