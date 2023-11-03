const CircuitBreaker = require("opossum");

function asyncFunctionThatCouldFail(x, y) {
  return new Promise((resolve, reject) => {
    // Do something, maybe on the network or a disk
    if (x == 3) {
      resolve("listo");
      return;
    }
    setTimeout(() => resolve("3"), 1001);
  });
}

const options = {
  timeout: 1000, // If our function takes longer than 3 seconds, trigger a failure
  errorThresholdPercentage: 50, // When 50% of requests fail, trip the circuit
  resetTimeout: 500, // After 30 seconds, try again.
};
const breaker = new CircuitBreaker(asyncFunctionThatCouldFail, options);

async function main() {
  try {
    const result = await breaker.fire(5, 4);
    console.log(result);
  } catch (e) {
    console.log("uwu",e.message);
  }

  try {
    const result = await breaker.fire(3, 4);

    console.log(result);
  } catch (e) {
    console.log("uwu",e.message);
  }

  setTimeout(() => {
    (async () => {
      try {
        const result = await breaker.fire(3, 4);
        console.log(result);
      } catch (e) {
        console.log("uwu");
      }
    })();
  }, 700);

  //   console.log(breaker.stats);
}

main();
