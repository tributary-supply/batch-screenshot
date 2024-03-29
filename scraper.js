require('dotenv').config();
require('newrelic');
var PORT = process.env.PORT || 3000;
var express = require('express');
// const MongoClient = require('mongodb').MongoClient;
// const bodyParser = require("body-parser");
const cors = require('cors');
const ejs = require('ejs');
const jwt = require('jsonwebtoken')
const fs = require("fs");

// const puppeteer = require('puppeteer')
const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())

// const browshot = require('browshot');
var validator = require('validator');
var cookieParser = require('cookie-parser');
const sgMail = require('@sendgrid/mail');
const decompress = require('decompress');
const pptxgen = require('pptxgenjs');
var rimraf = require("rimraf");
const ssUtils = require('./ss-utils/utils')
const csv = require('./csv');


sgMail.setApiKey(process.env.SENDGRID_API_KEY);
// var client = new browshot(`${process.env.BROWSHOT_API_KEY}`);


var app = express();
const url = process.env.MONGO_URL;
var timeout;
var emailZip = '';
let todaysDate = new Date()
let isScraping=false;

//mongo 
// MongoClient.connect(url)
// .then(async client =>{
//   const db = client.db('scraper');
//   const custCollection = db.collection('products');
//   // const subsCollection = db.collection('subscriptions');
//   const cronCollection = db.collection('cron');
//   app.locals.custCollection = custCollection;  //these allow the routes to see the collection
//   // app.locals.subsCollection = subsCollection;
//   // app.locals.cronCollection = cronCollection;
//   await mostRecentCron(cronCollection)
// })
// async function mostRecentCron(collection){
//   const resultArr = []
//   const cursor = await collection.find().sort({'date_run': -1}).limit(1)
//   await cursor.forEach((doc, err)=> {
//     resultArr.push(doc)
//   }, function(){
//     currentDate = JSON.parse(JSON.stringify(resultArr[0].date_run))
//     currentDate = currentDate.split('T')[0]
//   })
// };


//boilerplate
app.use(express.static(__dirname + '/'));
app.set('view engine','ejs');
app.use(express.urlencoded({
  extended: true
}));
app.use(cors())
app.use(cookieParser());

app.get('/login', function(req,res){
  return res.render('login.ejs')
})
app.get('/success', function(req, res){
  return res.render('success.ejs')
})

app.post('/login', (req, res) => {
  const pw = {
    password: req.body.password
  }
  if (req.body.password === process.env.APP_PASSWORD){
    var token = jwt.sign({pw : pw}, "secretkey", {expiresIn: '30s'} )
    res.cookie('JWT', token, {maxAge: 3000000})
    res.redirect('/')
  } else {
    console.log("PASSWORD IS INCORRECT")
    res.redirect('/login')
  }
})

//serves up the form page by rendering index.ejs to '/'
app.get('/', verifyToken, function(req, res){
  return res.render('index.ejs')
})
//sends data from form to screenshot.js and then redirects back to the form page
app.post('/screenshot', verifyToken, (req, res) => {
  const { sendZipEmail, size, singleUrl, batchName, message, scrapeOrScreenshot, screenWidth, screenHeight} = req.body
  let emailArr = sendZipEmail.split(' ').filter(i => i)
  var ssData = {
    sendZipEmail: emailArr,
    batchUrls: singleUrl,
    // screenshotSize: size,
    batchName: batchName,
    message: message,
    scrapeOrScreenshot: scrapeOrScreenshot
    // screenWidth: screenWidth,
    // screenHeight: screenHeight
  }
  ssData.scrapeOrScreenshot == "scrape" ? scrape(ssData) : ssUtils.batchScreenShot(ssData);
  res.redirect('/success')
})

app.listen(PORT, function(){
  console.log("Server is running on port 3000")
})


const scrape = async (data) => {
  const formattedUrlsArr = await formatData(data.batchUrls)

  //this arr is for data objs from all urls
  let scrapedData = []
  await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080','--user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36"'] })
  .then(async browser => {
    //loop through the urls
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(0);

    for (i = 0; i < formattedUrlsArr.length; i++) {
      let currentUrl = formattedUrlsArr[i]
      try {
        console.log(`working on ${i+1} of ${formattedUrlsArr.length} ... `,currentUrl)
        await page.goto(currentUrl, {
        waitUntil: 'load',
        timeout: 0 // Remove the timeout
      });
        await page.waitForSelector('body');
        
      } catch (error) {
        console.log(error)
      }

      // let aisnOrig = formattedUrlsArr[i]
      // console.log("formattedUrlsArr",formattedUrlsArr[i])
      let reviewsLink;

      var productInfo = await page.evaluate(async () => {

        let errorText, title, price, images, stars, style, byLine, category, asin, buyBox, shipsFrom, availability, description, altImgs, hasAPlusContent, ratingCount, features, formattedFeatures;
        if(document.querySelector('#g > div > a > img')){
          errorText = document.querySelector('#g > div > a > img').alt

        } else {
          errorText = null

          title = document.querySelector('#productTitle') !== null ? document.querySelector('#productTitle').innerText : null
          price = document.querySelector('#priceblock_saleprice') !== null ? document.querySelector('#priceblock_saleprice').innerText 
            : document.querySelector('#priceblock_ourprice') !== null ? document.querySelector('#priceblock_ourprice').innerText 
            : document.querySelector('#priceblock_dealprice') !== null ? document.querySelector('#priceblock_dealprice').innerText : null;
          images = document.querySelector('.a-dynamic-image') !== null ? document.querySelector('.a-dynamic-image').src : null

          stars = document.querySelector('.a-icon-alt') !== null ? document.querySelector('.a-icon-alt').innerText : null
          stars = stars != null ? stars.split(' ')[0] : null

          style = document.querySelector('.selection') !== null ? document.querySelector('.selection').innerText : null;
          byLine = document.querySelector('#bylineInfo') !== null ? document.querySelector('#bylineInfo').innerText : null
          category = document.querySelector('#wayfinding-breadcrumbs_feature_div ul li:last-child span a') !== null ? document.querySelector('#wayfinding-breadcrumbs_feature_div ul li:last-child span a').innerText : null
          asin = document.querySelector('#productDetails_detailBullets_sections1 tbody tr:first-child td') !== null ? document.querySelector('#productDetails_detailBullets_sections1 tbody tr:first-child td').innerText : null

          buyBox = document.querySelector('#buy-now-button') !== null ? 'yes': null
          shipsFrom = document.querySelector('#tabular-buybox-container') !== null ? document.querySelector('#tabular-buybox-container').innerHTML.includes('Amazon.com') ? 'yes': null : null;
          availability = document.querySelector('#availability span') !== null ? document.querySelector('#availability span').innerText : null
          
          description = document.querySelector('#productDescription')
          altImgs = document.querySelectorAll('#altImages > ul .item')
          hasAPlusContent = document.querySelector('#aplus_feature_div') ? "yes" : null
          ratingCount = document.querySelector('#acrCustomerReviewText') ? document.querySelector('#acrCustomerReviewText').innerText : null
          
          reviewsLink = document.querySelector('#cr-pagination-footer-0 > a') !== null ? document.querySelector('#cr-pagination-footer-0 > a').getAttribute('href') : document.querySelector('#reviews-medley-footer > div > a') !==null ? document.querySelector('#reviews-medley-footer > div > a').getAttribute('href') : null;

          features = document.body.querySelectorAll('#feature-bullets ul li .a-list-item') || null;
          formattedFeatures = [];
          if(features!== null){
            features.forEach((feature) => {
                formattedFeatures.push(feature.innerText);
            });
          }
        }



        // let relatedDesc = document.querySelectorAll('#sims-consolidated-1_feature_div .sims-fbt-rows ul li a')  //contain the descriptions
        // let relatedLinks = document.querySelectorAll('#sims-consolidated-1_feature_div .sims-fbt-rows ul li a')  //contain the ASIDS
        // let relatedDivs = document.querySelectorAll('#sims-consolidated-1_feature_div .sims-fbt-rows ul li:not(:first-child)')  //contain the ASIDS

        // let related = [] //array of related products objects
        // let relCount = 0
        // relatedDivs.forEach(div => {
        //   let dataObj = JSON.parse(div.getAttribute('data-p13n-asin-metadata'))
        //   let price = dataObj.price
        //   let asin = dataObj.asin
        //   let desc;
        //   let href;
        //   relatedLinks.forEach(link => {
        //     if(!link.innerText.includes('Details') && link.getAttribute('href').includes(asin)){
        //       desc = link.innerText
        //       href = link.getAttribute('href')
        //     }
        //   })
        //   if(relCount == 0){
        //     related.push({
        //       relAsin: dataObj.asin,
        //       relPrice: dataObj.price,
        //       relDescription: desc
        //     })
        //     relCount++
        //   } else {
        //     related.push({
        //       relAsin2: dataObj.asin,
        //       relPrice2: dataObj.price,
        //       relDescription2: desc
        //     })
        //     relCount = 0
        //   }
        // })
        // console.log("RELATED", related)

        var product;
        if(errorText){
          product = {'asin': errorText, 'error': true}
        } else {
          var product = { 
            "asin": asin,
            "price": price,
            "buyBox": buyBox,
            "shipsFrom": shipsFrom,
            "availability": availability,
            "category": category,
            "title": title,
            "altImages": altImgs !== null ? altImgs.length : null,
            "images": images,
            "aPlusContent": hasAPlusContent,
            "descriptionLength": description == null ? null : description.length,
            "bulletCount": features.length - 1,
            "features": formattedFeatures,
            "ratingCount": ratingCount,
            "reviewCount": reviewsLink,
            "stars": stars,
            "style": style,
            "byLine": byLine,

            // "relatedProducts": related,
            // "relAsin" : related.length > 0 ? related[0].relAsin : 'none',
            // "relPrice" : related.length > 0 ? related[0].relPrice : 'none',
            // "relDescription" : related.length > 0 ? related[0].relDescription : 'none',
            // "relAsin2" : related.length > 1 ? related[1].relAsin2 : 'none',
            // "relPrice2" : related.length > 1 ? related[1].relPrice2 : 'none',
            // "relDescription2" : related.length > 1 ? related[1].relDescription2 : 'none',
            // "rel asin" : related[0].relAsin ? related[0].relAsin : 'none',
            // "rel price": related[0].relPrice,
            // "rel description": related[0].relDescription,
            // "rel asin 2" : related[1].relAsin2,
            // "rel price 2": related[1].relPrice2,
            // "rel description 2": related[1].relDescription2
          };

        }
        return product;
      });
      productInfo.origAsin = currentUrl.split("/dp/")[1]

      

      // console.log(`https://www.amazon.com${productInfo.reviewCount}`)
      if(productInfo.reviewCount){
        await page.goto(`https://www.amazon.com${productInfo.reviewCount}`);
        await page.waitForSelector('body');
  
        productInfo.reviewCount = await page.evaluate(async () => {
          let result = await document.querySelector('#filter-info-section div span').innerText
          result = result.split(' | ')[1].split(' ')[0]
          return result
        })
      }

      // console.log("prioductINFFOOO", productInfo)
      await scrapedData.push(productInfo);
      // productInfo.relatedProducts.forEach(product =>{
      //   scrapedData.push(product)
      // })
    }
    // console.log("SCRAPE", scrapedData)
    await browser.close();
  }).catch(function(error) {
    console.error(error);
  });
  
  let batchName = data.batchName ? data.batchName : "batch"
  const issueProducts = await findIssues(scrapedData)
  
  await csv.createErrorCSV(issueProducts, batchName)
  await csv.createCSV(scrapedData, batchName)
  await createPPT(scrapedData, data)
  await sendMail(scrapedData, data, batchName)
  await removeAllCsv(batchName)

  await console.log('finished')
  return scrapedData
}




async function createPPT(data, origData){
  // 1. Create a new Presentation
  let pres = await new pptxgen();
  for (i=0;i<data.length;i++){
    // console.log('ASIN IN PPT FUNC', data[i].asin)
    // if (data[i].asin.includes('Sorry')){
    //   continue
    // }else {
      let slide = await pres.addSlide();
      let rows = []
      // rows.push(["First", "Second", "Third"]);
      rows.push([{ text: `${data[i].title}`, options: { color: "2d2d2d", bold: true, fontSize: 12 } }]);
      rows.push([{ text: `MADE BY: ${data[i].byLine}`, options: { color: "666666", fontSize: 8} }]);
      rows.push([{ text: `${data[i].price}`, options: { color: "2d2d2d", fontSize: 10 } }]);
      rows.push([{ text: `Stars: ${data[i].stars}`, options: { color: "2d2d2d", fontSize: 10 } }]);
      rows.push([{ text: `Style: ${data[i].style}`, options: { color: "2d2d2d", fontSize: 10 } }]);
  
      for (j = 1; j < data[i].features.length; j++) {
        rows.push([{ text: `Feature ${j}: ${data[i].features[j]}`, options: { color: "2d2d2d", fontSize: 8 } }]);
      };
  
      if (data[i].images !== "no image") {
        await slide
        .addImage({
          path: data[i].images,
          x: 0.2,
          y: 1,
          w: 3.8,
          h: 3.8,
        })
      }
      await slide
      .addTable(rows, { x: 4.2, y: 0.2, w: "55%", fontFace:'Helvetica' })
      .addText(`Category: ${data[i].category}`, { x: .2, y: .1, w: "35%", fill: "ffffff", color: "666666", fontSize:14, margin: .2 })
      // .addText(`URL: https://www.amazon.com/dp/${data[i].sku}`, { x: .2, y: .4, w: "35%", fill: "ffffff", color: "666666", fontSize:14, margin: .2 })
      .addText(`Original ASIN: ${data[i].origAsin}`, { x: .2, y: .4, w: "35%", fill: "ffffff", color: "666666", fontSize:14, margin: .2 })
      .addText(`ASIN: ${data[i].asin}`, { x: .2, y: .6, w: "35%", fill: "ffffff", color: "666666", fontSize:14, margin: .2 })
      console.log("slide created")

    // }
  }
  let batchName = origData.batchName ? origData.batchName : "batch"
  await pres.writeFile(`${batchName}.pptx`)
  await console.log(`${batchName}.pptx saved`)
}


//SENDGRID MAIL
const sendMail = async(inputData, origData, batchName) => {
  pathToAttachment = `${__dirname}/${batchName}.pptx`;
  attachment = await fs.readFileSync(pathToAttachment).toString("base64");
  pathToAttachment2 = `${__dirname}/${batchName}.csv`;
  attachment2 = await fs.readFileSync(pathToAttachment2).toString("base64");
  pathToAttachment3 = `${__dirname}/${batchName}-issues.csv`;
  attachment3 = await fs.readFileSync(pathToAttachment3).toString("base64");

  let pptName = `${origData.batchName}.pptx`
  let csvName = `${origData.batchName}.csv`
  let csvIssuesName = `${origData.batchName}-issues.csv`

  const formattedDate = formatDate(todaysDate)

  const msg = {
    to: origData.sendZipEmail,
    from: 'admin@sgy.co',
    subject: `${origData.batchName} --- Tributary Supply Scraper`,
    html: `
      <h1>${origData.batchName}</h1>
      <h3> Date scraped: ${formattedDate} </h3>
      <h3>3 files attached: ppt, csv & issues csv</h3>
      <p> ${origData.message} </p>
      <h4>ASID/URL List:</h4>
      <p> ${origData.batchUrls} </p>
      `,
    attachments: [
      {
        content: attachment,
        filename: pptName,
        type: 'application/pptx',
        disposition: 'attachment'
      },
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
  await console.log(`Email Sent to ${origData.sendZipEmail}`)
}



// -----------------------------------------------------------

// -----------------------------------------------------------

// -----------------------------------------------------------




//UTILS -----------------------------------------------------------
async function findIssues(data){
  let issueData = []
  data.map(item => {
    console.log('availablitilty', item.availability, item.availability !== 'In Stock.')
    if(item.price == null || item.buyBox == null || item.shipsFrom == null || item.availability !== 'In Stock.'){
      issueData.push({
        asin: item.asin,
        origAsin: item.origAsin,
        title: item.title,
        price: item.price,
        buybox: item.buyBox,
        shipsFrom: item.shipsFrom,
        availability: item.availability
      })
    }
  })
  return issueData
}

function formatData(data){
  const dataArr = data.split(" ").filter(i => i)
  for (i = 0; i < dataArr.length; i++){
    //SHOULD CHECK HERE TO SEE IF IT IS AN AMAZON URL

    //if it's not a url, it must be an ASID, so add the url
    if (!validator.isURL(dataArr[i])){
      dataArr[i] = `https://amazon.com/dp/${dataArr[i]}`
      // console.log('formatted url', dataArr[i])
    } else {
      //otherwise just return it
      dataArr[i] = `${dataArr[i]}`
    }
  }
  // return dataArr.join('')
  // console.log("FORMATTED",dataArr)
  return dataArr
}

function verifyToken(req, res, next) {
  const bearerHeader = req.cookies.JWT
  // console.log("COOKIED TOKEN", req.cookies.JWT)

  if (bearerHeader !== undefined){
    const bearerToken = bearerHeader.split(' ')[1]
    req.token = bearerToken
    next()
  } else {
    // res.sendStatus(403); //forbidden
    console.log("auth failed/your cookie has expired")
    res.redirect('/login')
  }
}

async function removeAllCsv(batchName){
  await fs.unlink(`${batchName}.pptx`, (err) => {
    if (err) throw err;
    console.log(`${batchName}.pptx was deleted`);
  });
  await fs.unlink(`${batchName}.csv`, (err) => {
    if (err) throw err;
    console.log(`${batchName}.csv was deleted`);
  });
  await fs.unlink(`${batchName}-issues.csv`, (err) => {
    if (err) throw err;
    console.log(`${batchName}-issues.csv was deleted`);
  });
}

function formatDate(date){
  let dateFormatted = date.toString().split(' ')
  dateFormatted= `${dateFormatted[1]} ${dateFormatted[2]} ${dateFormatted[3]}`
  // console.log(dateFormatted)
  return dateFormatted
}