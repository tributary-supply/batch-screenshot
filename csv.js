const ObjectsToCsv = require('objects-to-csv');

const createCSV = async(data, batchName) => {
  //data is all the scraped data
  // console.log("DATA", data)

  const csv = new ObjectsToCsv(data);
  // Save to file:
  await csv.toDisk(`./${batchName}.csv`);
  // Return the CSV file as string:
  // console.log(await csv.toString());
}

module.exports = {
  createCSV: createCSV
}