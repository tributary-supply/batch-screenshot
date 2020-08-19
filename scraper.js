require('dotenv').config();
var PORT = process.env.PORT || 3000;
var express = require('express');
const bodyParser = require("body-parser");
const cors = require('cors');
const ejs = require('ejs');
const jwt = require('jsonwebtoken')
const fs = require("fs");
const puppeteer = require('puppeteer')
var validator = require('validator');
var cookieParser = require('cookie-parser');
// var nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');
const { DownloaderHelper } = require('node-downloader-helper');
const decompress = require('decompress');
const pptxgen = require('pptxgenjs');
const { get } = require('http');
var rimraf = require("rimraf");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

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
    res.cookie('JWT', token, {maxAge: 300000})
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
  const { sendZipEmail, size, singleUrl, batchName, message, screenWidth, screenHeight} = req.body
  var ssData = {
    sendZipEmail: sendZipEmail,
    batchUrls: singleUrl,
    screenshotSize: size,
    batchName: batchName,
    message: message,
    // screenWidth: screenWidth,
    // screenHeight: screenHeight
  }
  scrape(ssData)
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
    for (i = 0; i < formattedUrlsArr.length; i++) {
      console.log("working on... ",formattedUrlsArr[i])
      const page = await browser.newPage();
      await page.goto(formattedUrlsArr[i]);
      await page.waitForSelector('body');
  
      var productInfo = await page.evaluate(() => {
        
        /* Get product title */
        let title = document.querySelector('#productTitle').innerText;
        let price = document.querySelector('#priceblock_saleprice') !== null ? document.querySelector('#priceblock_saleprice').innerText : document.querySelector('#priceblock_ourprice').innerText;
        let images = document.querySelector('.a-dynamic-image').src;
        let stars = document.querySelector('.a-icon-alt').innerText;
        let style = document.querySelector('.selection') !== null ? document.querySelector('.selection').innerText : 'no style provided';
        let byLine = document.querySelector('#bylineInfo') !== null ? document.querySelector('#bylineInfo').innerText : 'no by line'
        let category = document.querySelector('#wayfinding-breadcrumbs_feature_div ul li:last-child span a') !== null ? document.querySelector('#wayfinding-breadcrumbs_feature_div ul li:last-child span a').innerText : 'no category'
  
        let features = document.body.querySelectorAll('#feature-bullets ul li .a-list-item');
        let formattedFeatures = [];
        features.forEach((feature) => {
            formattedFeatures.push(feature.innerText);
        });
        var product = { 
          "title": title,
          "price": price,
          "images": images,
          "stars": stars,
          "features": formattedFeatures,
          "style": style,
          "byLine": byLine,
          "category": category
        };
        return product;
      });
      productInfo.url = formattedUrlsArr[i]
      // console.log(productInfo.features)
      scrapedData.push(productInfo);
      page.close();
    }
    await browser.close();
    // return scrapedData
  }).catch(function(error) {
    console.error(error);
  });
  // await console.log('scraped data', scrapedData)
  createPPT(scrapedData, data)
  return scrapedData
}




async function createPPT(data, origData){
  // 1. Create a new Presentation
  let pres = await new pptxgen();
  // 2. Add a Slide
  for (i=0;i<data.length;i++){
    // console.log(data[i].features)
    let slide = await pres.addSlide();
    let rows = []
    // rows.push(["First", "Second", "Third"]);
    rows.push([{ text: `TITLE: ${data[i].title}`, options: { color: "2d2d2d", bold: true, fontSize: 12 } }]);
    rows.push([{ text: `MADE BY: ${data[i].byLine}`, options: { color: "666666", fontSize: 8} }]);
    rows.push([{ text: `${data[i].price}`, options: { color: "2d2d2d", fontSize: 10 } }]);
    rows.push([{ text: `${data[i].stars}`, options: { color: "2d2d2d", fontSize: 10 } }]);
    rows.push([{ text: `${data[i].style}`, options: { color: "2d2d2d", fontSize: 10 } }]);
    // rows.push([{ text: `URL: ${data[i].url}`, options: { color: "666666"} }]);

    for (j = 1; j < data[i].features.length; j++) {
      rows.push([{ text: `${data[i].features[j]}`, options: { color: "2d2d2d", fontSize: 8 } }]);
    };

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
    .addTable(rows, { x: 4.2, y: 0.2, w: "55%", fontFace:'Helvetica' })
    .addText(`Category: ${data[i].category}`, { x: .2, y: .1, w: "35%", fill: "ffffff", color: "666666", fontSize:14, margin: .2 })
    .addText(`URL: ${data[i].url}`, { x: .2, y: .4, w: "35%", fill: "ffffff", color: "666666", fontSize:14, margin: .2 })
    console.log("slide created")
  }
  let batchName = origData.batchName ? origData.batchName : "batch"
  await pres.writeFile(`${batchName}.pptx`)
  await console.log(`${batchName}.pptx saved`)
  //delete the folder with images
  // await rimraf("dist", await function () { console.log("dist deleted"); });
  await sendMail(data, origData, batchName)
}




//SENDGRID MAIL
const sendMail = async(inputData, origData, batchName) => {
  // console.log(origData)
  pathToAttachment = `${__dirname}/${batchName}.pptx`;
  attachment = await fs.readFileSync(pathToAttachment).toString("base64");
  const msg = {
    to: `${origData.sendZipEmail}`,
    from: 'admin@sgy.co',
    subject: `${origData.batchName} --- Here is your batch`,
    // text: `${origData.batchName} \n${origData.batchUrls}\n\nThe PPTX file is attached! \n\n ${origData.message}`,
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
}




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
  console.log("FORMATTED",dataArr)
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