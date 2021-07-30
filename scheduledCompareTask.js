console.log('running cron')
require('dotenv').config();
const asins = require('./asinList').asinsWithCompetitors
const scrapeUtils = require('./scrapeUtils')
const MongoClient = require('mongodb').MongoClient
// const puppeteer = require('puppeteer')
// const csv = require('./csv');

const url = process.env.MONGO_URL;

const client = new MongoClient(url)

async function run(){
  try {
    await client.connect()
    const db = client.db('scraper')
    const comparedCompCollection = db.collection('compared_with_competitors');
    const scrapedData = await scrapeUtils.scrape(asins)
    const updateDB = await updateDataBase(scrapedData, comparedCompCollection)
    console.log(scrapedData)
  } finally {
    await client.close()
    console.log("Mongo Client Closed")
  }
}

async function updateDataBase(dataArr, collection){
  for(i=0; i < dataArr.length; i++){
    const query = { origAsin:  dataArr[i].origAsin}
      const options = { upsert: true };
      let update = {
        $set: {
          origAsin: dataArr[i].origAsin,
          asin: dataArr[i].asin,
          title: dataArr[i].title,
          // price: dataArr[i].price,
          // buyBox: dataArr[i].buyBox,
          // shipsFrom: dataArr[i].shipsFrom,
          // availability: dataArr[i].availability,

          // category: dataArr[i].category,
          // title: dataArr[i].title,
          // altImages: dataArr[i].altImgs ? dataArr[i].altImgs.length : null,
          // images: dataArr[i].images,
          // aPlusContent: dataArr[i].hasAPlusContent,
          // descriptionLength: dataArr[i].description ? dataArr[i].description.length : null,
          bulletCount: dataArr[i].features ? dataArr[i].features.length - 1 : null,
          features: dataArr[i].formattedFeatures,
          // ratingCount: dataArr[i].ratingCount,
          // reviewCount: dataArr[i].reviewsLink,
          // stars: dataArr[i].stars,
          // style: dataArr[i].style,
          // byLine: dataArr[i].byLine,

          // issueDayCount: issueDayCount[0],
          // issueField: issueDayCount[1],
          // timesFixed: timesFixed,
          // firstIssueDate: JSON.stringify(issueDayCount[2]),
        }
      }
      // }
      const result = await collection.updateOne(query, update, options)
      console.log('object inserted')
  }
}

// run().catch(console.dir) //logs the data
run()

// NOT GETTING BULLETS CORRECTLY!!!!!