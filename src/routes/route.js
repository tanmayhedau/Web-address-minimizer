const express = require('express');
const urlController = require("../controllers/urlController")
const router = express.Router();

router.post("/url/shorten", urlController.createUrl)



module.exports = router;