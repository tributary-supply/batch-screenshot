require('dotenv').config();
var PORT = process.env.PORT || 3000;
var express = require('express');
const bodyParser = require("body-parser");
const cors = require('cors');
const ejs = require('ejs');
const jwt = require('jsonwebtoken')
const fs = require("fs");
const puppeteer = require('puppeteer')
const browshot = require('browshot');
var validator = require('validator');
var cookieParser = require('cookie-parser');
// var nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');
const { DownloaderHelper } = require('node-downloader-helper');
const decompress = require('decompress');
const pptxgen = require('pptxgenjs');
const { get } = require('http');
var rimraf = require("rimraf");
const ssUtils = require('./ss-utils/utils')
const csv = require('./csv');
const { count } = require('console');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
var client = new browshot(`${process.env.BROWSHOT_API_KEY}`);


var app = express();
var timeout;
var emailZip = '';

//boilerplate
app.use(express.static(__dirname + '/'));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({
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
  // const formattedUrlsArr = ['https://www.amazon.com/dp/B07ZX6P2PT']

  //this arr is for data objs from all urls
  let scrapedData = []
  await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080','--user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36"'] })
  .then(async browser => {
    //loop through the urls
    const page = await browser.newPage();
    for (i = 0; i < formattedUrlsArr.length; i++) {
      console.log(`working on ${i+1} of ${formattedUrlsArr.length} ... `,formattedUrlsArr[i])
      await page.goto(formattedUrlsArr[i]);
      await page.waitForSelector('body');

      // let aisnOrig = formattedUrlsArr[i]
      // console.log("formattedUrlsArr",formattedUrlsArr[i])
      let reviewsLink;

      var productInfo = await page.evaluate(async () => {
        let title = document.querySelector('#productTitle') !== null ? document.querySelector('#productTitle').innerText : 'no title'
        let price = document.querySelector('#priceblock_saleprice') !== null ? document.querySelector('#priceblock_saleprice').innerText : document.querySelector('#priceblock_ourprice') !== null ? document.querySelector('#priceblock_ourprice').innerText : 'no price given';
        let images = document.querySelector('.a-dynamic-image') !== null ? document.querySelector('.a-dynamic-image').src : `no image`
        let stars = document.querySelector('.a-icon-alt') !== null ? document.querySelector('.a-icon-alt').innerText: `no star rating`
        let style = document.querySelector('.selection') !== null ? document.querySelector('.selection').innerText : 'no style provided';
        let byLine = document.querySelector('#bylineInfo') !== null ? document.querySelector('#bylineInfo').innerText : 'no by line'
        let category = document.querySelector('#wayfinding-breadcrumbs_feature_div ul li:last-child span a') !== null ? document.querySelector('#wayfinding-breadcrumbs_feature_div ul li:last-child span a').innerText : 'no category'
        let asin = document.querySelector('#productDetails_detailBullets_sections1 tbody tr:first-child td') !== null ? document.querySelector('#productDetails_detailBullets_sections1 tbody tr:first-child td').innerText : "not available"
        
        let description = document.querySelector('#productDescription')
        let altImgs = document.querySelectorAll('#altImages > ul .item')
        let hasAPlusContent = document.querySelector('#aplus_feature_div') ? "yes" : "no"
        let ratingCount = document.querySelector('#acrCustomerReviewText').innerText
        
        reviewsLink = document.querySelector('#cr-pagination-footer-0 > a') !== null ? document.querySelector('#cr-pagination-footer-0 > a').getAttribute('href') : document.querySelector('#reviews-medley-footer > div > a').getAttribute('href')

        let features = document.body.querySelectorAll('#feature-bullets ul li .a-list-item');
        let formattedFeatures = [];
        features.forEach((feature) => {
            formattedFeatures.push(feature.innerText);
        });

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

        var product = { 
          "asin": asin,
          "price": price,
          "category": category,
          "title": title,
          "altImages": altImgs.length,
          "images": images,
          "aPlusContent": hasAPlusContent,
          "descriptionLength": description.length,
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
        return product;
      });
      productInfo.origAsin = formattedUrlsArr[i].split("/dp/")[1]

      console.log(`https://www.amazon.com${productInfo.reviewCount}`)
      await page.goto(`https://www.amazon.com${productInfo.reviewCount}`);
      await page.waitForSelector('body');

      productInfo.reviewCount = await page.evaluate(async () => {
        let result = await document.querySelector('#filter-info-section div span').innerText
        result = result.split(' | ')[1].split(' ')[0]
        return result
      })

      console.log("prioductINFFOOO", productInfo)
      scrapedData.push(productInfo);
      // productInfo.relatedProducts.forEach(product =>{
      //   scrapedData.push(product)
      // })
    }
    console.log("SCRAPE", scrapedData)
    // page.close();
    await browser.close();
  }).catch(function(error) {
    console.error(error);
  });
  
  //testing
  let batchName = "batch"
  // scrapedData.splice(0,0,{  //this adds a header row
  //   "title": '',
  //   "asid": '',
  //   "price": '',
  //   "rel asin" : '',
  //   "rel price": '',
  //   "rel description": '',
  //   "rel asin 2" : '',
  //   "rel price 2": '',
  //   "rel description 2": ''
  // })
  // createPPT(scrapedData, data)  //ORIGINAL PATH
  // await csv.createCSV(scrapedData, 'testing-2')
  await createPPT(scrapedData, data)
  // await csv.createCSV(scrapedData, data.batchName)

  await console.log('finished')
  return scrapedData
}




async function createPPT(data, origData){
  // 1. Create a new Presentation
  let pres = await new pptxgen();
  for (i=0;i<data.length;i++){
    let slide = await pres.addSlide();
    let rows = []
    // rows.push(["First", "Second", "Third"]);
    rows.push([{ text: `TITLE: ${data[i].title}`, options: { color: "2d2d2d", bold: true, fontSize: 12 } }]);
    rows.push([{ text: `MADE BY: ${data[i].byLine}`, options: { color: "666666", fontSize: 8} }]);
    rows.push([{ text: `${data[i].price}`, options: { color: "2d2d2d", fontSize: 10 } }]);
    rows.push([{ text: `${data[i].stars}`, options: { color: "2d2d2d", fontSize: 10 } }]);
    rows.push([{ text: `${data[i].style}`, options: { color: "2d2d2d", fontSize: 10 } }]);

    for (j = 1; j < data[i].features.length; j++) {
      rows.push([{ text: `${data[i].features[j]}`, options: { color: "2d2d2d", fontSize: 8 } }]);
    };

    if (data[i].images !== "no image") {
      await slide
      .addImage({
        path: data[i].images,
        x: 0.2,
        y: 1,
        w: 3.8,
        h: 3.8,
        // sizing: { 
        //   type:'contain',
        //   w: 4,
        //   h: 4,
        // }
      })
    }
    await slide
    .addTable(rows, { x: 4.2, y: 0.2, w: "55%", fontFace:'Helvetica' })
    .addText(`Category: ${data[i].category}`, { x: .2, y: .1, w: "35%", fill: "ffffff", color: "666666", fontSize:14, margin: .2 })
    .addText(`URL: ${data[i].url}`, { x: .2, y: .4, w: "35%", fill: "ffffff", color: "666666", fontSize:14, margin: .2 })
    console.log("slide created")
  }
  let batchName = origData.batchName ? origData.batchName : "batch"
  await pres.writeFile(`${batchName}.pptx`)
  await console.log(`${batchName}.pptx saved`)
  await csv.createCSV(data, batchName)
  await sendMail(data, origData, batchName)
}


//SENDGRID MAIL
const sendMail = async(inputData, origData, batchName) => {
  pathToAttachment = `${__dirname}/${batchName}.pptx`;
  attachment = await fs.readFileSync(pathToAttachment).toString("base64");
  
  pathToAttachment2 = `${__dirname}/${batchName}.csv`;
  attachment2 = await fs.readFileSync(pathToAttachment2).toString("base64");
  
  const msg = {
    to: origData.sendZipEmail,
    from: 'admin@sgy.co',
    subject: `${origData.batchName} --- Here is your powerpoint presentation!`,
    html: `
      <h1>${origData.batchName}</h1>
      <h3>The PPTX file is attached!</h3>
      <p> ${origData.message} </p>
      <h4>ASID/URL List:</h4>
      <p> ${origData.batchUrls} </p>
      `,
    attachments: [
      {
        content: attachment,
        fileName: `${origData.batchName}.pptx`,
        type: 'application/pptx',
        dispostion: 'attachment'
      },
      {
        content: attachment2,
        fileName: `${origData.batchName}.csv`,
        type: 'text/csv',
        dispostion: 'attachment'
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
  await fs.unlink(`${batchName}.pptx`, (err) => {
    if (err) throw err;
    console.log(`${batchName}.pptx was deleted`);
  });
  await fs.unlink(`${batchName}.csv`, (err) => {
    if (err) throw err;
    console.log(`${batchName}.csv was deleted`);
  });
}



// -----------------------------------------------------------

// -----------------------------------------------------------

// -----------------------------------------------------------




//UTILS -----------------------------------------------------------
function formatData(data){
  const dataArr = data.split(" ").filter(i => i)
  for (i = 0; i < dataArr.length; i++){
    //SHOULD CHECK HERE TO SEE IF IT IS AN AMAZON URL

    //if it's not a url, it must be an ASID, so add the url
    if (!validator.isURL(dataArr[i])){
      dataArr[i] = `https://amazon.com/dp/${dataArr[i]}`
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