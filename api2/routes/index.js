const express = require("express");
const router = express.Router();
const axios = require("axios");
const CircuitBreaker = require("opossum");
require("dotenv").config();
const createClient = require("@libsql/client").createClient;

const { producer, topic_db, topic_http } = require("../bmq_config");

function getAnimeData(id) {
  return new Promise((resolve, reject) => {
    axios
      .get(`https://api.jikan.moe/v4/anime?q=${id}`)
      .then((response) => resolve(response.data))
      .catch((error) => reject(error));
  });
}

const anime_exists = async (id) => {
  const result = await client.execute({
    sql: `SELECT count(1) FROM "anime" WHERE id = :id`,
    args: { id: Math.floor(id) },
  });
  let count = result.rows[0]["count (1)"];
  return count > 0;
};

const get_anime = async (id) => {
  const result = await client.execute({
    sql: `SELECT content FROM "anime" WHERE id = :id`,
    args: { id },
  });
  return result.rows[0]["content"];
};

const breaker = new CircuitBreaker(getAnimeData, {
  rollingCountTimeout: 60000,
  rollingCountBuckets: 60,
  volumeThreshold: 400,
  errorThresholdPercentage: 60,
  resetTimeout: 3000,
});

const client = createClient({
  url: process.env.TURSO_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

router.get("/get-anime/:id", async (req, res) => {
  const id = req.params.id;

  if (!id) {
    res.status(404).send({ message: "ID is required" });
    return;
  }
  try {
    //ver base datos

    //en caso no exista, se busca en la api

    if (!(await anime_exists(id))) {
      const animeData = await breaker.fire(id);

      //si se encuentra se sube a la base de datos

      const message = {
        key: id,
        content: JSON.stringify(animeData),
      };

      await producer.send({
        topic: topic_db,
        messages: [{ message }],
      });

      res.send(animeData);
      return;
    } else {
      const responseData = await get_anime(id);

      res.send(JSON.parse(responseData));
    }
  } catch (error) {
    console.log("fallo: ", error.message);
    if (error?.response?.status == 429) {
      if (breaker.opened) {
        console.log("CB abierto");
      }

      producer.send({
        topic: topic_http,
        messages: [{ value: id }],
      });
      res.status(503).send("Service unavailable");
      return;
    }
    res.status(404).send("No se encontro el anime");
  }
});

module.exports = router;
