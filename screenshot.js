require('dotenv').config();
var PORT = process.env.PORT || 3000;
var express = require('express');
const bodyParser = require("body-parser");
const cors = require('cors');
const ejs = require('ejs');
const jwt = require('jsonwebtoken')
const browshot = require('browshot');
const fs = require("fs");
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
var client = new browshot(`${process.env.BROWSHOT_API_KEY}`);
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

  batchScreenShot(ssData)
  emailZip = sendZipEmail
  res.redirect('/success')
})

app.listen(PORT, function(){
  console.log("Server is running on port 3000")
})



// client.instanceList(function(list) {
// 	// Check the list of free browsers
// 	console.log("Free instances:");
// 	for(var i in list.free) {
// 		console.log(`\t#${list.free[i].id}: ${list.free[i].browser.name} ${list.free[i].width}x${list.free[i].height}`);
// 	}
// });
// client.instanceList(function(list) {
// 	// Check the list of free browsers
// 	console.log("Free instances:");
// 	for(var i in list.shared) {
// 		console.log(`\t#${list.shared[i].id}: ${list.shared[i].browser.name} ${list.shared[i].width}x${list.shared[i].height} ${list.shared[i].country}`);
// 	}
// });

// rimraf("dist", function () { console.log("dist deleted"); });
// downloadThenDecompress('https://browshot.com/static/batch/browshot-5262-lTQQKVv11WiHondpG4AlYDa.zip')

//UTIL PRIMARY FUNCTIONS-------------------------------------------------
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

const batchScreenShot = (data) => {
  const submittedData = formatData(data.batchUrls)
  console.log("SUBMITTED",submittedData)
  fs.writeFile("batch.txt", `${submittedData}`, (err) => {
    if (err) {
      console.log(`Failed to write list of URLs batch.txt: ${err}`);
    }
    else {
      console.log("WRITTEN!!!!")
      // sendMail('YOUR ZIPPED FOLDER WILL BE IN THE NEXT ONE!')
      // sendEmail2('HERES THE URL').catch(console.error)
      submitBatch("batch.txt", data);
    }
  });
}

//UTIL SECONDARY FUNCTIONS-------------------------------------------------
function formatData(data){
  const dataArr = data.split(" ").filter(i => i)
  for (i = 0; i < dataArr.length; i++){
    if (!validator.isURL(dataArr[i])){
      dataArr[i] = `https://amazon.com/dp/${dataArr[i]}\n`
    } else {
      dataArr[i] = `${dataArr[i]}\n`
    }
  }
  return dataArr.join('')
}

function submitBatch(file, options) {
	client.batchCreate(
		// file, 65, { screen_width: 1600, screen_height: 1200, size: 'page' }, 175 USA FF 13 USA CHROME
		file, 13, { screen_width: `${options.screenWidth}`, screen_height: `${options.screenHeight}`, size: `${options.screenshotSize}`, name: `${options.batchName}` }, 
		function(batch) {
			fs.unlink(file, function() {});
			
			if (batch.status == 'error') {
				console.log("Batch failed: " + batch.error);
			}
			else {
				console.log(`Batch #${batch.id} in process`);
				// Check the status of the batch every 30 seconds
				timeout = setInterval(function() {checkBatch(batch.id, options)} , 1000 * 30);
			}
		}
	);
}

function checkBatch(id, data) {
	client.batchInfo(id, { }, function(batch) {
		if (batch.status == 'error') {
			clearInterval(timeout);
			
			console.log("Batch failed: " + batch.error);
		}
		else if (batch.status == 'finished') {
			clearInterval(timeout);
			// The batch succeeded, download the archive. There may be more than 1 URL
      console.log("BATCH URL ARRAY LENGTH", batch.urls.length)
			for(var i in batch.urls) {
        console.log(`URL OF ZIP ${batch.urls[i]}  ...`);
        downloadThenDecompress(batch.urls[i], data)
        // sendMail(batch.urls[i])
        // sendEmail2(batch.urls[i]).catch(console.error)
			}
		}
		else {
			console.log(`Waiting for batch ${batch.id} to finish`);
		}
	});
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
    text: `${inputData.batchName} \n${inputData.batchUrls}\n\nThe PPTX file is attached!\n -OR- \nJust click this link and you will be directed to save a .zip file to your device: \n${url}`,
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

async function downloadThenDecompress(zipURL, data){
  console.log("attempting DL from: ", zipURL)
  const dl = await new DownloaderHelper(zipURL, __dirname, {
    method: 'GET',
    fileName: 'zipFolder.zip',
    retry: { maxRetries: 8, delay: 300 }
  });
  try {
    await dl.on('retry', (attempt, retryOpts) => console.log('Retrying Download', attempt, retryOpts))
    await dl.on('end', (info) => console.log('Download Completed'))
    await dl.on('error', async (err) => {
      await downloadThenDecompress(zipURL, data)
      // if (err) throw err;
      // console.log(err)
    })

    //getting random 404 response from this makes error script run and run function again
    await dl.start();
    console.log("HERE")

    let files = await decompress('zipFolder.zip', 'dist')
    await createPPT(files, zipURL, data)

    await fs.unlink('zipFolder.zip', (err) => {
      if (err) throw err;
      console.log('zip folder was deleted: PROCESS FINISHED');
    });

  } catch (error) {
    // console.log("ERROR: ", error);
  }
}

async function createPPT(files, zipURL, inputData){
  // 1. Create a new Presentation
  const dataArr = inputData.batchUrls.split(" ").filter(i => i)
  console.log(dataArr)
  let pres = await new pptxgen();
  // 2. Add a Slide
  for (i=0;i<files.length;i++){
    if (files[i].type == 'directory'){
      continue;
    } else {
      let slide = await pres.addSlide();
      await slide
      .addImage({
        path: `dist/${files[i].path}`,
        x: 0,
        y: 0,
        w: 9,
        h: 5.5,
        sizing: { 
          type:'contain',
          w: 9,
          h: 5.5,
        }
      }
      )
      .addText(`ASID/URL:\n${dataArr[i]}`, { x: 0, y: 0, w: "30%", h: 1.4, fill: "ffffff", color: "666666", margin: 1 })
      console.log("slide created")
    }
  }
  await pres.writeFile("test.pptx")
  console.log('pptx saved')
  //delete the folder with images
  await rimraf("dist", await function () { console.log("dist deleted"); });
  await sendMail(zipURL, inputData)
}


//NODEMAILER SENDMAIL SCRIPT
// const sendEmail2 = async (url) => {
//   console.log(url)
//   // create reusable transporter object using the default SMTP transport
//   let transporter = nodemailer.createTransport({
//     host: `${process.env.HOST}`,
//     port: process.env.EMAIL_PORT,
//     secure: process.env.SECURE, // true for 465, false for other ports
//     auth: {
//       user: `${process.env.USERNAME}`,
//       pass: `${process.env.EMAIL_PASSWORD}`
//     },
//   });

//   // send mail with defined transport object
//   let info = await transporter.sendMail({
//     from: `${process.env.EMAIL}`, // sender address
//     to: emailZip, // list of receivers
//     subject: 'Here is your batch of screenshots!', // Subject line
//     text: `Just click this link and you will be directed to save a .zip file to your device: ${url}`, // plain text body
//     // html: "<b>Hello world?</b>", // html body
//   });
//   console.log("Message sent: %s", info.messageId);
// }