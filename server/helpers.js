const delay = (delay) => {
  return new Promise((res, rej) => {
    setTimeout(res, delay);
  });
} 

module.exports = { delay };