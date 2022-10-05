const express = require('express');
const urlController = require("../controllers/urlController")
const router = express.Router();
const app = express();
// app.use(express.json());


router.post("/url/shorten", urlController.shortURL);

router.get('/:urlCode',urlController.redirectURL)





module.exports = router;