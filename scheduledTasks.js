console.log('running cron')

require('dotenv').config();
const scrapeUtils = require('./scrapeUtils')
const MongoClient = require('mongodb').MongoClient;
const sgMail = require('@sendgrid/mail');
const fs = require("fs");
const asins = require('./asinList').asins
// const asins = require('./asinList').asins2
const csv = require('./csv');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const url = process.env.MONGO_URL;
let todaysDate = new Date()

MongoClient.connect(url)
.then(async client =>{
  const db = client.db('scraper');
  const productsCollection = db.collection('products');
  const cronCollection = db.collection('cron');
  await updateDB(productsCollection, cronCollection) //updates the products AND cron
  let dbData = await getAllFromDB(productsCollection) //gets all data from db and creates CSVs
  await sendMail(dbData)
  // await console.log(dbData)
  // await updateCronDb(cronCollection)
})

async function updateDB(productsCollection, cronCollection){
  console.log('running cron...')
  let scrapedData = await scrapeUtils.scrape(asins)
  // console.log('SCRAPED',scrapedData)
  await upsertMany(scrapedData, productsCollection)

  await cronCollection.insertOne({"Date": todaysDate})

}


async function upsertMany(dataArr, collection){
  try {
    for(i=0;i<dataArr.length;i++){
      const issueDayCount = await getIssueDayCount(dataArr[i], collection)
      // console.log('issueeeeee', dataArr[i].asin, issueDayCount)
      const query = { origAsin:  dataArr[i].origAsin}
      const options = { upsert: true };
      let update
      // if(dataArr[i].error == true){
      //   update = {
      //     $set: {
      //       asin: dataArr[i].asin,
      //       error: dataArr[i].error,
      //       origAsin: dataArr[i].origAsin
      //     }
      //   }
      // } else{
        update = {
          $set: {
            asin: dataArr[i].asin,
            title: dataArr[i].title,
            price: dataArr[i].price,
            buyBox: dataArr[i].buyBox,
            shipsFrom: dataArr[i].shipsFrom,
            availability: dataArr[i].availability,
  
            category: dataArr[i].category,
            title: dataArr[i].title,
            altImages: dataArr[i].altImgs ? dataArr[i].altImgs.length : null,
            images: dataArr[i].images,
            aPlusContent: dataArr[i].hasAPlusContent,
            descriptionLength: dataArr[i].description ? dataArr[i].description.length : null,
            bulletCount: dataArr[i].features ? dataArr[i].features.length - 1 : null,
            features: dataArr[i].formattedFeatures,
            ratingCount: dataArr[i].ratingCount,
            reviewCount: dataArr[i].reviewsLink,
            stars: dataArr[i].stars,
            style: dataArr[i].style,
            byLine: dataArr[i].byLine,
  
            issueDayCount: issueDayCount,
            // issueFirstFoundDate: new Date()
            origAsin: dataArr[i].origAsin
          }
        }
      // }
      const result = await collection.updateOne(query, update, options)
      // console.log(`${result} documents were inserted`);
      console.log('object inserted')
    }
    // await console.log('new data updated to db')
  } catch(err){
    console.log(err)
  } finally {
    console.log('done adding data to mongoDB')

    // await client.close();
  }
}

async function getAllFromDB(collection){
  const cursor = collection.find()
  let results = []
  await cursor.forEach((doc, err) => {
    results.push(doc)
  });
  await csv.createCSV(results, `all products for ${todaysDate}`)
  
  let issueData = await scrapeUtils.findIssues(results)
  await csv.createErrorCSV(issueData, `issues for ${todaysDate}`)

  let fixedData = await scrapeUtils.findFixed(results)
  if(fixedData.length < 1){ //if there are no products that were fixed this time around, send a default msg in csv
    fixedData = [{
      data:'no products were fixed since last cronjob',
    }]
  }
  await csv.createFixedCSV(fixedData, `fixes for ${todaysDate}`)
  // console.log(results)
}



async function getIssueDayCount(scrapedData, collection){
  let prod;
  if(scrapedData.asin == null){
    prod = await collection.findOne({ origAsin: scrapedData.origAsin})
  } else{
    prod = await collection.findOne({ asin: scrapedData.asin})
  }
  
  if(scrapedData.price == null || scrapedData.buyBox == null || scrapedData.shipsFrom == null || scrapedData.availability !== 'In Stock.'){ //if the newly scraped data has issues, see if it had issues before. if it has, add 1, if it hasn't set to 1
    console.log("ISSSUEEEEE")
    if(prod){  //make sure the product exists in the db

      if(prod.price == null || prod.buyBox == null || prod.shipsFrom == null || prod.availability !== 'In Stock.'){ //check that the same item in db also has issues
        if(prod.issueDayCount >= 1){  //if it has issues and this IS NOT the first time
          return prod.issueDayCount + 1  //add 1 to issue field
        } else { //if it's the first time having an issue
          return 1
        }
      } else { //if the db item doesn't have issues, then this is the first, set to 1
        return 1
      }
  
    } else { //the product didn't exist in the db and the newlty scraped data has issues
      return 1
    }

  } else if(prod && prod.issueDayCount >= 1){ //the newly scrpaed data didn't have any issues, set to null - if the db data had issues and the scraped data doesn't have issues
    return `Fixed after ${prod.issueDayCount} days`
  } else {
    return null
  }

}



//SENDGRID MAIL
const sendMail = async() => {
  let sendTo = process.env.EMAILS.split(',');
  // let sendTo = ['dan@sgyida.com', 'anit@sgyida.com', 'jake@sgyida.com', 'keith@sgyida.com']
  // pathToAttachment = `${__dirname}/${batchName}.pptx`;
  // attachment = await fs.readFileSync(pathToAttachment).toString("base64");
  
  pathToAttachment2 = `${__dirname}/all products for ${todaysDate}.csv`;
  attachment2 = await fs.readFileSync(pathToAttachment2).toString("base64");

  pathToAttachment3 = `${__dirname}/issues for ${todaysDate}-issues.csv`;
  attachment3 = await fs.readFileSync(pathToAttachment3).toString("base64");

  pathToAttachment4 = `${__dirname}/fixes for ${todaysDate}-fixed.csv`;
  attachment4 = await fs.readFileSync(pathToAttachment4).toString("base64");

  // let pptName = `${origData.batchName}.pptx`
  let csvName = `all products for ${todaysDate}.csv`
  let csvIssuesName = `issues for ${todaysDate}-issues.csv`
  let csvFixedName = `fixes for ${todaysDate}-fixed.csv`
  // console.log("BATCHNAMMEEEEEE", pptName, csvName, csvIssuesName)

  const msg = {
    to: sendTo,
    from: 'admin@sgy.co',
    subject: `${todaysDate} --- Here are your batch of CSVs for the day!`,
    html: `
      <h1>${todaysDate}</h1>
      <h3>See today's issues on Amazon products.</h3>
      <p> Check it out </p>
      <h4>ASID/URL List:</h4>
      <p> ${asins.toString()} </p>
      `,
    attachments: [
      // {
      //   content: attachment,
      //   filename: pptName,
      //   type: 'application/pptx',
      //   disposition: 'attachment'
      // },
      {
        content: attachment2,
        filename: csvName,
        type: 'text/csv',
        disposition: 'attachment'
      },
      {
        content: attachment3,
        filename: csvIssuesName,
        type: 'text/csv',
        disposition: 'attachment'
      },
      {
        content: attachment4,
        filename: csvFixedName,
        type: 'text/csv',
        disposition: 'attachment'
      }
    ]
  };
  await sgMail
    .send(msg)
    .then(() => {}, error => {
      console.error(error);
  
      if (error.response) {
        console.error(error.response.body)
      }
    });
  await console.log(`Email Sent to ${sendTo}`)
  // await fs.unlink(`${batchName}.pptx`, (err) => {
  //   if (err) throw err;
  //   console.log(`${batchName}.pptx was deleted`);
  // });
  await fs.unlink(`all products for ${todaysDate}.csv`, (err) => {
    if (err) throw err;
    console.log(`all products for ${todaysDate}.csv was deleted`);
  });
  await fs.unlink(`issues for ${todaysDate}-issues.csv`, (err) => {
    if (err) throw err;
    console.log(`issues for ${todaysDate}-issues.csv was deleted`);
  });
  await fs.unlink(`fixes for ${todaysDate}-fixed.csv`, (err) => {
    if (err) throw err;
    console.log(`fixes for ${todaysDate}-fixed.csv was deleted`);
  });
}