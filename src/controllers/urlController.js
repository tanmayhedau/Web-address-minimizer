const urlModel = require("../models/urlModel");
const shortId = require('shortid');
const validURL = require('valid-url');
//const config = require('config')
const { isPresent } = require('../validator/validator'); 
const { findOne } = require("../models/urlModel");


const shortURL = async function (req, res) {
    try {
        let { longUrl, shortUrl, urlCode } = req.body
        let baseUrl = "http://localhost:3000"

        if (!isPresent(longUrl)) return res.status(400).send({ status: false, message: "long URL is mandatory" });

        if (!validURL.isUri(longUrl)) return res.status(400).send({ status: false, message: "long URL is invalid" });

        if (!validURL.isUri(baseUrl)) return res.status(400).send({ status: false, message: "baseUrl is invalid" });

        if (!isPresent(urlCode) || !isPresent(shortUrl)){
            req.body.urlCode = shortId.generate().toLowerCase();
            req.body.shortUrl = baseUrl + "/" + req.body.urlCode;
        }

        

        let findURL = await urlModel.findOne({ longUrl: longUrl });

        if (!findURL) {

            let createURL = await urlModel.create(req.body)
            return res.status(201).send({ status: true, message: "successfully shortend", data: createURL })

        }

        return res.status(400).send({ status: true, message: "already exists" })

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }

}

const redirectURL = async function(req,res){
    try {

        let urlCode = req.params.urlCode

        if(!urlCode)return res.status(400).send({status:false , message : "provide urlCode"});
        
        let findUrlCode = await urlModel.findOne({urlCode : urlCode});

        if(!findUrlCode)return res.status(400).send({status:false , message : "urlCode does not exist"}); 
        
        return res.status(302).redirect(findUrlCode.longUrl)

        
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}

module.exports = { shortURL , redirectURL}


// router.get('/:code', async (req, res) => {
//     try {
//         // find a document match to the code in req.params.code
//         const url = await Url.findOne({
//             urlCode: req.params.code
//         })
//         if (url) {
//             // when valid we perform a redirect
//             return res.redirect(url.longUrl)
//         } else {
//             // else return a not found 404 status
//             return res.status(404).json('No URL Found')
//         }

//     }