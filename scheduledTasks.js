console.log('running cron')

require('dotenv').config();
const scrapeUtils = require('./scrapeUtils')
const MongoClient = require('mongodb').MongoClient;
const sgMail = require('@sendgrid/mail');
const fs = require("fs");
const asins = require('./asinList').asins
const testData = require('./asinList').testData
const asins2 = require('./asinList').asins2
const csv = require('./csv');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const url = process.env.MONGO_URL;

let todaysDate = new Date()
// todaysDate = `${todaysDate.getMonth()}-${todaysDate.getDay()}-${todaysDate.getFullYear()}`
console.log("TODAYS DATE",todaysDate)

MongoClient.connect(url)
.then(async client =>{
  const db = client.db('scraper');
  const productsCollection = db.collection(process.env.PRODUCTS_COLLECTION);
  // const productsCollection = db.collection('productsTest');
  const cronCollection = db.collection('cron');

  let scrapedData = await scrapeUtils.scrape(asins) //USE FOR PRODUCTION-----------------------------------------------------------------------------------------PROD
  // let scrapedData = await scrapeUtils.scrape(asins2) //USE FOR TESTING----------------------------------------------------------------------------------------TEST ASIN LIST
  // let scrapedData = testData // USE FOR TESTING---------------------------------------------------------------------------------------------------------------------TESTING
  // console.log('SCRAPED',scrapedData)

  await updateDB(productsCollection, cronCollection, scrapedData) //updates the products AND cron
  let dbData = await getAllFromDB(productsCollection) //gets all data from db and creates CSVs

  await sendMail(dbData) //sends mail to designated addresses ------------------------------------------------------------------------------------------------TURN OFF FOR DEVELOPMENT
  await removeAllCsv() //deletes the csvs
})

async function updateDB(productsCollection, cronCollection, scrapedData){
  console.log('running cron...')
  // console.log('SCRAPED',scrapedData)
  await upsertMany(scrapedData, productsCollection)
  await cronCollection.insertOne({"Date": todaysDate})
}


async function upsertMany(dataArr, collection){
  const notListed = []
  try {
    for(i=0;i<dataArr.length;i++){ //MAYBE MOVE THIS OUT OF TRYCATCH
      // console.log("ASIN IN UPSERT FUNC", dataArr[i].asin)

      if(dataArr[i].errorText == true){
        notListed.push(dataArr[i])
        console.log("NO PAGE COUNT:", notListed.length, dataArr[i].origAsin)
        continue
      }
      console.log("not listed", notListed)
      // console.log("SHIPS FROM", dataArr[i].shipsFrom)
      const issueDayCount = await getIssueDayCount(dataArr[i], collection) //returns an array [days, issue array, count]
      const timesFixed = await getTimesFixed(dataArr[i], collection, issueDayCount[0])

      const query = { origAsin:  dataArr[i].origAsin}
      const options = { upsert: true };
      let data = {
        origAsin: dataArr[i].origAsin,
        asin: dataArr[i].asin,
        title: dataArr[i].title,
        price: dataArr[i].price,
        buyBox: dataArr[i].buyBox,
        shipsFrom: dataArr[i].shipsFrom,
        availability: dataArr[i].availability,

        category: dataArr[i].category,
        title: dataArr[i].title,
        // altImages: dataArr[i].altImgs ? dataArr[i].altImgs.length : null,
        // images: dataArr[i].images,
        aPlusContent: dataArr[i].hasAPlusContent,
        descriptionLength: dataArr[i].description ? dataArr[i].description.length : null,
        bulletCount: dataArr[i].features ? dataArr[i].features.length - 1 : null,
        // features: dataArr[i].features,
        ratingCount: dataArr[i].ratingCount,
        reviewCount: dataArr[i].reviewsLink,
        stars: dataArr[i].stars,
        style: dataArr[i].style,
        byLine: dataArr[i].byLine,

        issueDayCount: issueDayCount[0],
        // issueField: issueDayCount[1],
        timesFixed: timesFixed,
        // firstIssueDate: JSON.stringify(issueDayCount[2]),
        firstIssueDate: issueDayCount[2],
      }
      console.log("FEATURES", dataArr[i].features)
      if(dataArr[i].features !== null || dataArr[i].features !== undefined || !dataArr[i].errorText.includes('Sorry')){
        for( j=0; j< dataArr[i].features.length; j++ ){ //add features array as separate key value pairs to save space
          data[`Feature ${j}`] = dataArr[i].features[j]
        }
      }
      // console.log("ISSUE DAY COUNT", issueDayCount)
      if(issueDayCount[1] !== null || issueDayCount[1 !== undefined]){
        for( j=0; j < issueDayCount[1].length; j++ ){ //add issues array as separate key value pairs to save space
          data[`Issue ${j}`] = issueDayCount[1][j]
        }
      }

      // console.log('DATA before push to DB', data)

      const result = await collection.replaceOne(query, data, options)
      // console.log(`${result} documents were inserted`);
      // console.log('object inserted', 'Current: ', dataArr[i].asin, 'next asin:', dataArr[i+1].asin)
    }
  } catch(err){
    console.log(err)
  } finally {
    console.log('done adding data to mongoDB')
  }
}

async function getAllFromDB(collection){
  const cursor = collection.find()
  let results = []
  await cursor.forEach((doc, err) => {
    results.push(doc)
  });
  await csv.createCSV(results, `all products for ${todaysDate}`)
  // console.log('RESULTS FROM GETALLFROMDB', results)
  let issueData = await scrapeUtils.findIssues(results)
  if(issueData.length < 1){ //if there are no products that were fixed this time around, send a default msg in csv
    issueData = [{
      data:'no products were fixed since last cronjob',
    }]
  }
  await csv.createErrorCSV(issueData, `issues for ${todaysDate}`)

  let fixedData = await scrapeUtils.findFixed(results)
  if(fixedData.length < 1){ //if there are no products that were fixed this time around, send a default msg in csv
    fixedData = [{
      data:'no products were fixed since last cronjob',
    }]
  }
  await csv.createFixedCSV(fixedData, `fixes for ${todaysDate}`)
}

async function getIssueDayCount(scrapedData, collection){
  let prod;
  prod = await collection.findOne({ origAsin: scrapedData.origAsin})
  if(scrapedData.price == null || scrapedData.buyBox == null || scrapedData.shipsFrom == null || scrapedData.availability !== 'In Stock.'){ //if the newly scraped data has issues, see if it had issues before. if it has, add 1, if it hasn't set to 1
    // console.log("ISSSUEEEEE")
    let issue = getIssuesArr(scrapedData)
    
    if(prod){  //make sure the product exists in the db
      if(prod.price == null || prod.buyBox == null || prod.shipsFrom == null || prod.availability !== 'In Stock.'){ //check that the same item in db also has issues
        if(prod.issueDayCount >= 1){  //if it has issues and this IS NOT the first time
          let comparedDates = compareDates(prod.firstIssueDate, todaysDate)
          let days = comparedDates > 1 ? Math.floor(comparedDates) : 1;
          return [days, issue, prod.firstIssueDate]  //add 1 to issue field
        } else { //if it's the first time having an issue
          return [1, issue, todaysDate] 
        }
      } else { //if the db item doesn't have issues, then this is the first, set to 1
        return [1, issue, todaysDate] 
      }
    } else { //the product didn't exist in the db and the newlty scraped data has issues
      return [1, issue, todaysDate] 
    }
  } else if(prod && prod.issueDayCount >= 1){ //if the db data had issues and the scraped data doesn't have issues, it must be fixed!
    return [`Fixed after ${prod.issueDayCount} days`, null, null]
    // return [`Fixed after ${prod.issueDayCount} days`, prod.issueField, null]
  } else { //the newly scrpaed data didn't have any issues, set to null
    return [null, null, null]
  }
}

async function getTimesFixed(scrapedData, collection, issueDayCount){ //needs to return a number, 0 if none fixed and increment if 'fixed'
  let timesFixed;
  const prod = await collection.findOne({ origAsin: scrapedData.origAsin})
  if(prod){
    if(prod.timesFixed == null){ //this is a new product and will get 0 assigned to timesfixed
      timesFixed = 0;
      console.log('NEW PRODUCT GETTING 0 ASSIGNED')
    } 
    if(issueDayCount == null || typeof(issueDayCount) == 'number'){  //make sure issuedaycount isnt a number or null - if it is then that means it can't say fixed - need to do this first becuase includes throws an error on null
      timesFixed = prod.timesFixed;
      console.log('MUST BE NULL ISSUEDAYCOUNT OR ISSUEDAYCOUNT IS A NUMBER')
  
    } else if(issueDayCount.includes('Fixed')){ //if this item listing has had an issue and then been fixed
      timesFixed = prod.timesFixed + 1
      console.log('HAS "FIXED" IN ISSUEDAYCOUNT')
      }
  } else{
    timesFixed = 0
  }
  return timesFixed
}



//SENDGRID MAIL
const sendMail = async() => {
  let sendTo = process.env.EMAILS.split(',');
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

  const formattedDate = formatDate(todaysDate)

  const msg = {
    to: sendTo,
    from: 'admin@sgy.co',
    subject: `${formattedDate} --- Here are your batch of files for the day!`,
    html: `
      <h1>${formattedDate}</h1>
      <h3>See today's issues on Amazon products.</h3>
      <p> There are 3 files, a full list of all ASINs, a file with issue product pages, and another with issues that were recently fixed. </p>
      <h4>ASID/URL List:</h4>
      <p> There were ${asins.length} successful scraped pages, here's an exhausting list</p>
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
}

async function removeAllCsv(){
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

function compareDates(date1, date2){
  var date1 = new Date(date1);
  var date2 = new Date(date2);
  var Difference_In_Time = date2.getTime() - date1.getTime();  // To calculate the time difference of two dates
  var Difference_In_Days = Difference_In_Time / (1000 * 3600 * 24);  // To calculate the no. of days between two dates
  console.log(Difference_In_Days)
  return Difference_In_Days
}

function getIssuesArr(scrapedData){ //formats the single data for an issue csv
  let resultArr = []
  scrapedData.price == null ? resultArr.push('price') : null
  scrapedData.buyBox == null ? resultArr.push('buyBox') : null
  scrapedData.shipsFrom == null ? resultArr.push('shipsFrom') : null
  scrapedData.availability !== 'In Stock.' ? resultArr.push('availability') : null
  return resultArr
}

function formatDate(date){
  let dateFormatted = date.toString().split(' ')
  dateFormatted= `${dateFormatted[1]} ${dateFormatted[2]} ${dateFormatted[3]}`
  return dateFormatted
}