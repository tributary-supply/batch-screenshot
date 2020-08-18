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
  const { sendZipEmail, size, singleUrl, batchName, screenWidth, screenHeight} = req.body
  var ssData = {
    sendZipEmail: sendZipEmail,
    batchUrls: singleUrl,
    screenshotSize: size,
    batchName: batchName,
    screenWidth: screenWidth,
    screenHeight: screenHeight
  }
  // async () => {
    scrape(ssData)
    // createPPT(scrapeData)
  // }

  //send data back to frontend?
  //send email
  // sendMail()

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
      console.log("formattedUrlsArr[i]",formattedUrlsArr[i])
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
  
        let features = document.body.querySelectorAll('#feature-bullets ul li .a-list-item');
        let formattedFeatures = [];
        features.forEach((feature) => {
            formattedFeatures.push(feature.innerText);
        });
        var product = { 
          // "URL": formattedUrlsArr[i],
          "title": title,
          "price": price,
          "images": images,
          "stars": stars,
          "features": formattedFeatures,
          "style": style,
        };
        return product;
      });
      productInfo.url = formattedUrlsArr[i]
      scrapedData.push(productInfo)
    }
    await browser.close();
    // return scrapedData
  }).catch(function(error) {
    console.error(error);
  });
  // await console.log('scraped data', scrapedData)
  createPPT(scrapedData)
  return scrapedData
}

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


//SENDGRID MAIL
const sendMail = async(url, inputData) => {
  console.log("INTO SENDMAIL")
  pathToAttachment = `${__dirname}/test.pptx`;
  attachment = await fs.readFileSync(pathToAttachment).toString("base64");
  const msg = {
    to: `${inputData.sendZipEmail}`,
    // to: `${inputData.sendZipEmail}`,
    from: 'admin@sgy.co', // Use the email address or domain you verified above
    subject: `${inputData.batchName} --- Here is your batch of screenshots!`,
    text: `${inputData.batchName} \n${inputData.batchUrls}\n\nThe PPTX file is attached!`,
    attachments: [
      {
        content: attachment,
        fileName: 'test.pptx',
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
  console.log("Email Sent")
  await fs.unlink('test.pptx', (err) => {
    if (err) throw err;
    console.log('test ppt was deleted');
  });
}


async function createPPT(data){
  // 1. Create a new Presentation
  // const dataArr = data.batchUrls.split(" ").filter(i => i)
  // console.log('PPT',data)
  let pres = await new pptxgen();
  // 2. Add a Slide
  for (i=0;i<data.length;i++){
    // console.log(data[i].url)
    let slide = await pres.addSlide();
    let rows = []
    // rows.push(["First", "Second", "Third"]);
    rows.push([{ text: `TITLE: ${data[i].title}`, options: { color: "666666" } }]);
    rows.push([{ text: `PRICE: ${data[i].price}`, options: { color: "666666" } }]);
    rows.push([{ text: `STARS: ${data[i].stars}`, options: { color: "666666" } }]);
    rows.push([{ text: `STYLE: ${data[i].style}`, options: { color: "666666" } }]);
    rows.push([{ text: `URL: ${data[i].url}`, options: { color: "666666" } }]);
    rows.push([{ text: `FEATURES: ${data[i].features}`, options: { color: "666666" } }]);

    await slide
    .addImage({
      path: data[i].images,
      x: 0,
      y: 1,
      w: 4,
      h: 4,
      // sizing: { 
      //   type:'contain',
      //   w: 4,
      //   h: 4,
      // }
    })
    .addTable(rows, { x: 4.5, y: 0, w: "50%", color: "363636", fontSize: 10 })
    // .addText(`TITLE: ${data[i].title}`,       { x: 4.5, y: 0, w: "40%", fill: "ffffff", color: "666666", fontSize:12, margin: .2 })
    // .addText(`PRICE: ${data[i].price}`,       { x: 4.5, y: 1, w: "40%", fill: "ffffff", color: "666666", fontSize:12, margin: .2 })
    // .addText(`URL: ${data[i].url}`,           { x: 4.5, y: 1.5, w: "40%", fill: "ffffff", color: "666666", fontSize:12, margin: .2 })
    // .addText(`FEATURES: ${data[i].features}`, { x: 4.5, y: 2, w: "40%", fill: "ffffff", color: "666666", fontSize:10, margin: .2 })
    console.log("slide created")
  }
  await pres.writeFile("test.pptx")
  console.log('pptx saved')
  //delete the folder with images
  // await rimraf("dist", await function () { console.log("dist deleted"); });
  // await sendMail(zipURL, inputData)
}
