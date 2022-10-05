const urlModel = require("../models/urlModel");
const shortId = require("shortid");
const validURL = require("valid-url");
const redis = require("redis");
const { promisify } = require("util");

const isValid = (value) => {
  if (typeof value === "undefined" || value === null) return false;
  if (typeof value === "string" && value.trim().length === 0) return false; //.trim() :remove spaces, should not mistake empty space as value
  return true;
};

const redisClient = redis.createClient(
  16325,
  "redis-16325.c301.ap-south-1-1.ec2.cloud.redislabs.com",
  { no_ready_check: true }
);

redisClient.auth("CxOuxBi8zhJs7AKP8t69tC18BzITAHr6", function (err) {
  if (err) throw err;
});

redisClient.on("connect", async function () {
  console.log("Connected to Redis..");
});

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);

const shortURL = async function (req, res) {
  try {
    let { longUrl, urlCode, shortUrl } = req.body;

    let baseUrl = "http://localhost:3000";

    if (!isValid(longUrl))
      return res
        .status(400)
        .send({ status: false, message: "long URL is mandatory" });

    let link =
      longUrl.startsWith("http://") ||
      longUrl.startsWith("https://") ||
      longUrl.startsWith("ftp://");
    // let regForUrl = /(:?^((https|http|HTTP|HTTPS){1}:\/\/)(([w]{3})[\.]{1})?([a-zA-Z0-9]{1,}[\.])[\w]((\/){1}([\w@? ^=%&amp;~+#-_.]+)))$/
    if (!link) {
      return res
        .status(400)
        .send({ status: false, message: "Please provide valid LongUrl" });
    }

    // if (!validURL.isUri(longUrl)) return res.status(400).send({ status: false, message: "long URL is invalid" });

    if (!isValid(urlCode) || !isValid(shortUrl)) {

      req.body.urlCode = shortId.generate().toLowerCase();
      req.body.shortUrl = baseUrl + "/" + req.body.urlCode;
    }

    let cachedURLCode = await GET_ASYNC(`${longUrl}`);
    if (cachedURLCode) {
      return res
        .status(201)
        .send({
          status: true,
          message: "Already URL shorten 1 ",
          data: JSON.parse(cachedURLCode),
        });
    }

    let findURL = await urlModel
      .findOne({ longUrl: longUrl })
      .select({ _id: 0, __v: 0 });

    if (!findURL) {
      let url = await urlModel.create(req.body);



      let createURL = {
        longUrl: url.longUrl,
        shortUrl: url.shortUrl,
        urlCode: url.urlCode,
      };

      await SET_ASYNC(`${longUrl}`, JSON.stringify(createURL));
      return res
        .status(201)
        .send({
          status: true,
          message: "successfully shortend",
          data: createURL,
        });
    }

    //409 : conflict with db
    return res
      .status(409)
      .send({
        status: true,
        message: "long URL already exists",
        data: findURL,
      });
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};

const redirectURL = async function (req, res) {
  try {
    let urlCode = req.params.urlCode;

    if (!urlCode)
      return res
        .status(400)
        .send({ status: false, message: "provide urlCode" });

    let cachedURLCode = await GET_ASYNC(`${urlCode}`);
    if (cachedURLCode) {
      // console.log("im in")
      return res.redirect(JSON.parse(cachedURLCode).longUrl);
    }

    let findUrlCode = await urlModel.findOne({ urlCode: urlCode });

    await SET_ASYNC(`${urlCode}`, JSON.stringify(findUrlCode));

    if (!findUrlCode)
      return res
        .status(404)
        .send({ status: false, message: "urlCode does not exist" });

    return res.redirect(findUrlCode.longUrl);
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};

module.exports = { shortURL, redirectURL };
