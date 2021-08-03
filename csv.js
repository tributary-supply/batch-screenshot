const ObjectsToCsv = require('objects-to-csv');
const csv = require('csvtojson')
const csvFilePath = './asin-compare-list.csv'

const convertCsvToJson = async() => { //returns an 
  let result = [];
  const jsonArray = await csv().fromFile(csvFilePath)
  for(i=0; i<jsonArray.length; i++){
    result.push({
      asin: jsonArray[i]["ASIN"],
      ref1: jsonArray[i]["Reference ASIN 1"],
      ref2: jsonArray[i]["Reference ASIN 2"],
      ref3: jsonArray[i]["Reference ASIN 3"]
    })
  }
  return result
}

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

const appendLog = async(data)=>{
  const csv = new ObjectsToCsv(data);
  // Save to file:
  await csv.toDisk(`./log.csv`, {append: true});
}


module.exports = {
  createCSV: createCSV,
  createErrorCSV: createErrorCSV,
  createFixedCSV: createFixedCSV,
  appendLog: appendLog,
  convertCsvToJson: convertCsvToJson
}