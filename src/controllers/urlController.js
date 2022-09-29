const urlModel = require("../models/urlModel");
const shortId = require('shortid');
const validURL = require('valid-url');
//const config = require('config')
const { isPresent } = require('../validator/validator');
const { findOne } = require("../models/urlModel");


const shortURL = async function (req, res) {
    try {
        let { longUrl, urlCode, shortUrl } = req.body
        let baseUrl = "http://localhost:3000"

        if (!isPresent(longUrl)) return res.status(400).send({ status: false, message: "long URL is mandatory" });

        if (!validURL.isUri(longUrl)) return res.status(400).send({ status: false, message: "long URL is invalid" });

        if (!validURL.isUri(baseUrl)) return res.status(400).send({ status: false, message: "baseUrl is invalid" });

        if (!isPresent(urlCode) || !isPresent(shortUrl)) {
            req.body.urlCode = shortId.generate().toLowerCase();
            req.body.shortUrl = baseUrl + "/" + req.body.urlCode;
        }

        let findURL = await urlModel.findOne({ longUrl: longUrl }).select({ _id: 0, __v: 0 })

        if (!findURL) {

            let url = await urlModel.create(req.body)

            let createURL = {
                longUrl: url.longUrl,
                shortUrl: url.shortUrl,
                urlCode: url.urlCode
            }
            return res.status(201).send({ status: true, message: "successfully shortend", data: createURL })

        }

        //409 : conflict with db
        return res.status(409).send({ status: true, message: "long URL already exists" , data:findURL })

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }

}



const redirectURL = async function (req, res) {
    try {

        let urlCode = req.params.urlCode

        if (!urlCode) return res.status(400).send({ status: false, message: "provide urlCode" });

        let findUrlCode = await urlModel.findOne({ urlCode: urlCode });

        if (!findUrlCode) return res.status(404).send({ status: false, message: "urlCode does not exist" });

        return res.redirect(findUrlCode.longUrl)


    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}

module.exports = { shortURL, redirectURL }


