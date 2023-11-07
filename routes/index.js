const express = require("express");
const router = express.Router();
const axios = require("axios");
const CircuitBreaker = require("opossum");
require("dotenv").config();
const createClient = require("@libsql/client").createClient;

function getAnimeData(name) {
  return new Promise((resolve, reject) => {
    axios
      .get(`https://api.jikan.moe/v4/anime?q=${name}`)
      .then((response) => resolve(response.data))
      .catch((error) => reject(error));
  });
}

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

router.get("/list", async (req, res) => {
  const name = req.query.name;

  if (!name) {
    res.status(404).send({ message: "Name is required" });
    return;
  }
  try {
    //ver base datos
    const result = await client.execute({
      sql: `select count(1) from "Data" where name = :name`,
      args: {
        name: name,
      },
    });
    const count = result.rows[0]["count (1)"];
    //en caso no exista, se busca en la api

    if (true) {
      const animeData = await breaker.fire(name);

      //si se encuentra se sube a la base de datos

      const nuevo_elemento = {
        name: name,
        content: JSON.stringify(animeData),
      };

      await client.execute({
        sql: `insert into "Data" values(:name, :content)`,
        args: nuevo_elemento,
      });

      res.send(animeData);
      return;
    } else {
      const result = await client.execute({
        sql: `select content from "Data" where name = :name`,
        args: {
          name: name,
        },
      });
      const responseData = result.rows[0]["content"];

      res.send(JSON.parse(responseData));
      // return;
    }
  } catch (error) {
    console.log("fallo: ", error.message);
    res.status(404).send("No se encontro el anime");
  }
});

module.exports = router;
