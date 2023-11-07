require("dotenv").config();

const axios = require("axios");
const express = require("express");
const { createHash } = require("crypto");
const app = express();
const { URL, BASE_PORT, N, currentPort = 25565 } = process.env;

// const maxRequests = 80000;

// const maxRequestsForNode = maxRequests / N;
const maxRequestsForNode = 200;
const actualRequestsByNode = new Array(parseInt(N)).fill(0);

function chooseNextAvailableNode() {
  let minNumber = Number.MAX_SAFE_INTEGER;
  let minIndex = -1;
  for (let i = 0; i < N; ++i) {
    const currentRequests = actualRequestsByNode[i];
    if (currentRequests < maxRequestsForNode && currentRequests < minNumber) {
      minNumber = currentRequests;
      minIndex = i;
    }
  }

  return minIndex;
}

app.get("/list", async (req, res) => {
  const name = req.query.name ?? "";
  const finalOffset = chooseNextAvailableNode();
  if (finalOffset === -1) {
    res.status(503).send({ message: "Server is down 2" });
    return;
  }

  const serverURL = `${URL}:${parseInt(BASE_PORT) + finalOffset}`;
  console.log(`Se eligio el server ${serverURL}`);
  console.log(actualRequestsByNode);//, finalOffset);

  try {
    actualRequestsByNode[finalOffset]++;
    const response = await axios.get(`${serverURL}/list?name=${name}`);
    res.send(response.data);
    actualRequestsByNode[finalOffset]--;
    // console.log("ke", actualRequestsByNode[finalOffset]);
  } catch (error) {
    // console.log(error)
    actualRequestsByNode[finalOffset]--;
    if (error?.code === "ECONNRESET" || error?.code === "ECONNREFUSED") {
      res.status(503).send({ message: "Server is down", error });
      return;
    }
    // console.log(error);
    res.status(404).send(error.response.data);
  }
});

app.listen(currentPort, () => {
  console.log("escuchando en", currentPort);
});
