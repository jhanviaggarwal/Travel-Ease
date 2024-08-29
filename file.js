const fs = require("fs");

const FILE_NAME = "./destinations.json";

const readFile = () => {
  if (!fs.existsSync(FILE_NAME)) {
    fs.writeFileSync(FILE_NAME, JSON.stringify([]));
  }
  return JSON.parse(fs.readFileSync(FILE_NAME, "utf-8"));
};

const writeFile = (data) => {
  fs.writeFileSync(FILE_NAME, JSON.stringify(data, null, 2));
};
module.exports = { readFile, writeFile };