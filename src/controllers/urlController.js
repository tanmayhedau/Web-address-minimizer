const urlModel = require("../models/urlModel");
const validUrl = require("valid-url");
const shortId = require("shortid");

//   const baseUrl = "http://localhost:3000/";

//   const isValid = function (value) {
//     if (typeof value == "undefined" || value == null) return false;
//     if (typeof value == "string" && value.trim().length == 0) return false;
//     if (typeof value == "number") return false;
//     return true;
//   };

const createUrl = async function (req, res) {
  try {
    // validate request body
    if (Object.keys(req.body).length ==0) {
      return res
        .status(400)
        .send({ status: true, message: "Data is required" });
    }

    // fetch longUrl and baseurl
    let longUrl = req.body.longUrl;
    let baseUrl = "http://localhost:3000/";

    // validating url
    if (!validUrl.isUri(longUrl)) {
      return res.status(400).send({ status: true, message: "Invalid Url" });
    }

    // check if url already shortened
    let uniqueUrl = await urlModel.findOne({ longUrl: longUrl });

    if (uniqueUrl)
      return res.status(409).send({
        status: true,
        message: "Url already shortened",
      });

    // generate urlCode
    let id = shortId.generate(longUrl);

    // check if urlCode already present
    let urlCode = await urlModel.findOne({ urlCode: id });
    
    if (urlCode)
      return res.status(409).send({
        status: true,
        message: "urlCode already exist",
      });

    // creating shortUrl
    let shortUrl = baseUrl + id;

    let obj = {
      longUrl: longUrl,
      shortUrl: shortUrl,
      urlCode: id,
    };

    // creating url document
    let url = await urlModel.create(obj);

    return res.status(201).send({
      status: true,
      message: "created",
      data: url,
    });

  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};

// const longUrl = req.body.longUrl
// const generate = (shortid.generate())
// console.log(generate)

// console.log(data)
// shortid.generate(longUrl,function (err, url){
//     if(err){
//         console.log(err)
//     }
//     console.log(url)
// })

module.exports = { createUrl };
