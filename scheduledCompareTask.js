console.log('running cron')
require('dotenv').config();
// const asins = require('./asinList').asinsWithCompetitors
const scrapeUtils = require('./scrapeUtils')
const MongoClient = require('mongodb').MongoClient
const csv = require('./csv');
const fs = require("fs");
const sgMail = require('@sendgrid/mail');

// const puppeteer = require('puppeteer')
// const csv = require('./csv');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const url = process.env.MONGO_URL;

const client = new MongoClient(url)

async function run(){
  try {
    await client.connect()
    const db = client.db('scraper')
    const comparedCompCollection = db.collection('compared_with_competitors');
    const dataFromCsv = await csv.convertCsvToJson()  //returns an array of obj {asin, ref1, ref2, ref3}
    // console.log(dataFromCsv)
    const pageSize = 50;
    const amountOfPagesInData = dataFromCsv.length/pageSize
    const lastPageSize = dataFromCsv.length % pageSize
    for( let pageNum = 1; pageNum < amountOfPagesInData; pageNum++){ //THIS NEEDS WORK HOW TO PAGINATE
      const currentPage = paginator(dataFromCsv, pageNum, pageSize)
      const currentPageData = currentPage.data
      console.log('WORKING ON PAGE ', currentPage.page, " OF", currentPage.total_pages, " - There are a total of ", currentPage.total, ' documents, ', pageSize,'/per page')

      const scrapedData = await scrapeUtils.scrapeCompareList(currentPageData, pageNum)
      const updateDB = await updateDataBase(scrapedData, comparedCompCollection)
    }
    
    const dataFromDb = await getData(comparedCompCollection)
    
    await csv.createCSV(dataFromDb, 'compared-products-scrape')

    await sendMail()
    // await removeCsv(`compared-products-scrape.csv`)

    // console.log(scrapedData)
  } finally {
    await client.close()
    console.log("Mongo Client Closed")
  }
}

async function getData(collection){
  const cursor = collection.find()
  let results = []
  await cursor.forEach((doc, err) => {
    results.push(doc)
  });
  return results
}

async function updateDataBase(dataArr, collection){
  for(i=0; i < dataArr.length; i++){
    const query = { asin:  dataArr[i].asin}
      const options = { upsert: true };
      let update = {
        $set: {
          asin: dataArr[i].asin,
          price: dataArr[i].price,
          packSize: dataArr[i].packSize,
          reviews: dataArr[i].reviews,

          ref1: dataArr[i].ref1,
          ref1Price: dataArr[i].ref1Price,
          ref1PackSize: dataArr[i].ref1PackSize,
          ref1Reviews: dataArr[i].ref1Reviews,

          ref2: dataArr[i].ref2,
          ref2Price: dataArr[i].ref2Price,
          ref2PackSize: dataArr[i].ref2PackSize,
          ref2Reviews: dataArr[i].ref2Reviews,
          
          ref3: dataArr[i].ref3,
          ref3Price: dataArr[i].ref3Price,
          ref3PackSize: dataArr[i].ref3PackSize,
          ref3Reviews: dataArr[i].ref3Reviews,
        }
      }
      // }
      const result = await collection.updateOne(query, update, options)
      console.log('object inserted', dataArr[i].asin)
    }
    console.log(dataArr.length, 'objects inserted into mongo')
}


//SENDGRID MAIL
const sendMail = async() => {
  let sendTo = process.env.COMPARE_EMAILS.split(',');

  const pathToAttachment = `${__dirname}/compared-products-scrape.csv`;
  const attachment = await fs.readFileSync(pathToAttachment).toString("base64");
  const csvName = `compared-products-scrape.csv`

  const msg = {
    to: sendTo,
    from: 'admin@sgy.co',
    subject: `Compared asins scrape`,
    html: `compared products`,
    attachments: [
      {
        content: attachment,
        filename: csvName,
        type: 'text/csv',
        disposition: 'attachment'
      },
    ]
  };
  await sgMail
    .send(msg).then(() => {}, error => {
      console.error(error);
      if (error.response) {
        console.error(error.response.body)
      }
    });
  await console.log(`Email Sent to ${sendTo}`)
}

async function removeCsv(filename){
  // await fs.unlink(`${batchName}.pptx`, (err) => {
  //   if (err) throw err;
  //   console.log(`${batchName}.pptx was deleted`);
  // });
  await fs.unlink('compared-products-scrape.csv', (err) => {
    if (err) throw err;
    console.log(`${filename} was deleted`);
  });
}

function paginator(items, current_page, per_page_items) {
	let page = current_page || 1,
	per_page = per_page_items || 10,
	offset = (page - 1) * per_page,

	paginatedItems = items.slice(offset).slice(0, per_page_items),
	total_pages = Math.ceil(items.length / per_page);

	return {
		page: page,
		per_page: per_page,
		pre_page: page - 1 ? page - 1 : null,
		next_page: (total_pages > page) ? page + 1 : null,
		total: items.length,
		total_pages: total_pages,
		data: paginatedItems
	};
}


// run().catch(console.dir) //logs the data

async function run2(){
  try {
    await client.connect()
    const db = client.db('scraper')
    db.repairDatabase()
  } finally {
    await client.close()
    console.log("Mongo Client Closed")
  }
}



// run2()
run()

