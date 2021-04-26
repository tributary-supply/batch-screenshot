const ObjectsToCsv = require('objects-to-csv');

const createCSV = async(data, batchName) => {
  //data is all the scraped data
  // console.log("DATA", data)

  // const csv = new ObjectsToCsv(data);
  const csv = new ObjectsToCsv(data);
  // Save to file:
  await csv.toDisk(`./${batchName}.csv`);
  // Return the CSV file as string:
  // console.log(await csv.toString());
}


const createErrorCSV = async(data, batchName) => {
  let issueData = []
  data.map(item => {
    console.log('availablitilty', item.availability, item.availability !== 'In Stock.')
    if(item.price == 'NULL' || item.buyBox == 'NULL' || item.shipsFrom == 'NULL' || item.availability !== 'In Stock.'){
      issueData.push({
        asin: item.asin,
        title: item.title,
        price: item.price,
        buybox: item.buyBox,
        shipsFrom: item.shipsFrom,
        availability: item.availability
      })
    }
  })
  //data is all the scraped data
  // console.log("DATA", data)

  // const csv = new ObjectsToCsv(data);
  const csv = new ObjectsToCsv(issueData);
  // Save to file:
  await csv.toDisk(`./${batchName}-issues.csv`);
  // Return the CSV file as string:
  // console.log(await csv.toString());
}

module.exports = {
  createCSV: createCSV,
  createErrorCSV: createErrorCSV
}