import "dotenv/config";
import { createClient } from "@libsql/client";
import axios from "axios";

async function submitName(names) {
  if (names.length > 0) {
    const [currentName, ...nextNames] = names;
    const response = await axios.get(
      `https://api.jikan.moe/v4/anime?q=${currentName}`
    );

    const nuevo_elemento = {
      name: currentName,
      content: JSON.stringify(response.data),
    };


    await client.execute({
      sql: `update "Data" set content=:content where name=:name`,
      args: nuevo_elemento,
    });

    console.log(currentName, "actualizado");
    // console.log(response.data);

    setTimeout(() => submitName(nextNames), 1500);
  }
}
const client = createClient({
  url: process.env.TURSO_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const result = await client.execute(`select name from "Data" `);

const names = result.rows.map((elem) => elem.name);

// console.log(names);
submitName(names);
