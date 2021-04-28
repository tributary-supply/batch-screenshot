require('dotenv').config();
const scrapeUtils = require('./scrapeUtils')
const MongoClient = require('mongodb').MongoClient;
const sgMail = require('@sendgrid/mail');
const fs = require("fs");


const asins = require('./asinList').asins
const csv = require('./csv');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const url = process.env.MONGO_URL;
let todaysDate = new Date()

MongoClient.connect(url)
.then(async client =>{
  const db = client.db('scraper');
  const productsCollection = db.collection('products');
  const cronCollection = db.collection('cron');
  await updateDB(productsCollection, cronCollection)
  let dbData = await getAllFromDB(productsCollection) //gets all and creates CSVs
  await sendMail(dbData)
  // await console.log(dbData)
})

async function updateDB(productsCollection, cronCollection){
  console.log('running cron...')
  let scrapedData = await scrapeUtils.scrape(asins)
  await upsertMany(scrapedData, productsCollection)

}


async function upsertMany(dataArr, collection){
  try {
    for(i=0;i<dataArr.length;i++){
      const query = { asin:  dataArr[i].asin}
      const options = { upsert: true };
      const update = {
        $set: {
          asin: dataArr[i].asin,
          title: dataArr[i].title,
          price: dataArr[i].price,
          buyBox: dataArr[i].buyBox,
          shipsFrom: dataArr[i].shipsFrom,
          availability: dataArr[i].availability,

          category: dataArr[i].category,
          title: dataArr[i].title,
          // altImages: dataArr[i].altImgs.length,
          images: dataArr[i].images,
          aPlusContent: dataArr[i].hasAPlusContent,
          // descriptionLength: dataArr[i].description.length,
          bulletCount: dataArr[i].features.length - 1,
          features: dataArr[i].formattedFeatures,
          ratingCount: dataArr[i].ratingCount,
          reviewCount: dataArr[i].reviewsLink,
          stars: dataArr[i].stars,
          style: dataArr[i].style,
          byLine: dataArr[i].byLine,
          // issueFirstFoundDate: new Date()
        }
      }
      const result = await collection.updateOne(query, update, options)
      // console.log(`${result} documents were inserted`);
      console.log('object inserted')
    }
    // await console.log('new data updated to db')
  } catch(err){
    console.log(err)
  } finally {
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
  // console.log(results)
}


// async function findIssues(data){
//   let issueData = []
//   data.map(item => {
//     console.log('availablitilty', item.availability, item.availability !== 'In Stock.')
//     if(item.price == 'NULL' || item.buyBox == 'NULL' || item.shipsFrom == 'NULL' || item.availability !== 'In Stock.'){
//       issueData.push({
//         asin: item.asin,
//         title: item.title,
//         price: item.price,
//         buyBox: item.buyBox,
//         shipsFrom: item.shipsFrom,
//         availability: item.availability
//       })
//     }
//   })
//   return issueData
// }






//SENDGRID MAIL
const sendMail = async() => {
  let sendTo = 'dan@sgyida.com'
  // pathToAttachment = `${__dirname}/${batchName}.pptx`;
  // attachment = await fs.readFileSync(pathToAttachment).toString("base64");
  
  pathToAttachment2 = `${__dirname}/all products for ${todaysDate}.csv`;
  attachment2 = await fs.readFileSync(pathToAttachment2).toString("base64");

  pathToAttachment3 = `${__dirname}/issues for ${todaysDate}-issues.csv`;
  attachment3 = await fs.readFileSync(pathToAttachment3).toString("base64");

  // let pptName = `${origData.batchName}.pptx`
  let csvName = `all products for ${todaysDate}.csv`
  let csvIssuesName = `issues for ${todaysDate}-issues.csv`
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
}