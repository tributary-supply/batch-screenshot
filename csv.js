const ObjectsToCsv = require('objects-to-csv');

const createCSV = async(data, batchName) => {
  //data is all the scraped data
  const csv = new ObjectsToCsv(data);
  // Save to file:
  await csv.toDisk(`./${batchName}.csv`);
  // Return the CSV file as string:
  // console.log(await csv.toString());
}


const createErrorCSV = async(data, batchName) => {
  const csv = new ObjectsToCsv(data);
  // Save to file:
  await csv.toDisk(`./${batchName}-issues.csv`);
}

const createFixedCSV = async(data, batchName) => {
  const csv = new ObjectsToCsv(data);
  // Save to file:
  await csv.toDisk(`./${batchName}-fixed.csv`);
}


module.exports = {
  createCSV: createCSV,
  createErrorCSV: createErrorCSV,
  createFixedCSV: createFixedCSV
}