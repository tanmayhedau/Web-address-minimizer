const urlModel = require("../models/urlModel");
const shortId = require("shortid");
// const validURL = require("valid-url");
const axios = require("axios");
const redis = require("redis");
const { promisify } = require("util");

const isValid = (value) => {
  if (typeof value === "undefined" || value === null) return false;
  if (typeof value === "string" && value.trim().length === 0) return false; //.trim() :remove spaces, should not mistake empty space as value
  return true;
};

//Connect to redis
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

//1. connect to the server
//2. use the commands :

//Connection setup for redis

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);

const createShortURL = async function (req, res) {
  try {
    if (!Object.keys(req.body).length > 0) {
      return res
        .status(400)
        .send({ status: true, message: "Request body can't be empty" });
    }

    let { longUrl } = req.body;
    longUrl = longUrl.trim();

    let baseUrl = "http://localhost:3000";

    if (!isValid(longUrl))
      return res
        .status(400)
        .send({ status: false, message: "long URL is mandatory" });

    // function isValidUrl(string) {
    //   const pattern =
    //     /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/gm;
    //   return pattern.test(string);
    // }

    // if (!isValidUrl(longUrl))
    //   return res
    //     .status(400)
    //     .send({ status: false, message: "long URL is invalid" });

    req.body.urlCode = shortId.generate().toLowerCase();
    req.body.shortUrl = baseUrl + "/" + req.body.urlCode;

    let cachedURLCode = await GET_ASYNC(`${longUrl}`);
    if (cachedURLCode) {
      return res.status(200).send({
        status: true,
        message: "Already URL shorten from redis ",
        data: JSON.parse(cachedURLCode),
      });
    }

    let findURL = await urlModel
      .findOne({ longUrl: longUrl })
      .select({ _id: 0, __v: 0, createdAt: 0, updatedAt: 0 });

    if (findURL) {
      let createURL = {
        longUrl: findURL.longUrl,
        shortUrl: findURL.shortUrl,
        urlCode: findURL.urlCode,
      };

      await SET_ASYNC(`${longUrl}`, JSON.stringify(createURL), "EX", 10);

      return res
        .status(200)
        .send({
          status: true,
          message: " I am coming from db already shortend ",
          data: findURL,
        });
    }

//alternate method for working longUrl
    let urlFound;
    let obj = {
      method: "get",
      url: longUrl,
    };
    await axios(obj)
      .then(() => (urlFound = true))
      .catch(() => {
        urlFound = false;
      });
    if (!urlFound) {
      return res
        .status(400)
        .send({ status: false, message: "Please provide valid LongUrl axios" });
    }

    let url = await urlModel.create(req.body);

    let createURL = {
      longUrl: url.longUrl,
      shortUrl: url.shortUrl,
      urlCode: url.urlCode,
    };

    await SET_ASYNC(`${longUrl}`, JSON.stringify(createURL), "EX", 10);
    return res.status(201).send({
      status: true,
      message: "successfully shortend",
      data: createURL,
    });
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};

const redirectURL = async function (req, res) {
  try {
    let urlCode = req.params.urlCode;

    let cachedURLCode = await GET_ASYNC(`${urlCode}`);
    if (cachedURLCode) {
      console.log("im in");
      return res.status(302).redirect(JSON.parse(cachedURLCode).longUrl);
    }

    let findUrlCode = await urlModel.findOne({ urlCode: urlCode });

    await SET_ASYNC(`${urlCode}`, JSON.stringify(findUrlCode), "EX", 10);

    if (!findUrlCode)
      return res
        .status(404)
        .send({ status: false, message: "urlCode does not exist" });

    return res.status(302).redirect(findUrlCode.longUrl);
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};

module.exports = { createShortURL, redirectURL };
