const express = require('express');
const router = express.Router();
const urlController = require('../controllers/urlController')

router.post("/url/shorten", urlController.shortURL);

//router.all('/*',(req,res)=> { return res.status(400).send({sataus:false , message : "Endpoint Is Incorrect"})})



module.exports = router;