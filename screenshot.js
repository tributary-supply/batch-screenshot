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
var nodemailer = require('nodemailer');
var cookieParser = require('cookie-parser');

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
// app.use(function(req, res, next) {
//   res.setHeader('Access-Control-Allow-Origin', "*");
//   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
//   res.setHeader('Access-Control-Allow-Headers', 'authorization, content-type');
//   next();
// });

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
  // console.log(size)
  res.redirect('/success')
})

app.listen(PORT, function(){
  console.log("Server is running on port 3000")
})




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
      // if(dataArr[i].length !== 10) {
        
      // }
      dataArr[i] = `https://amazon.com/dp/${dataArr[i]}\n`
    } else {
      dataArr[i] = `${dataArr[i]}\n`
    }
  }
  return dataArr.join('')
}

function submitBatch(file, options) {
	client.batchCreate(
		// file, 65, { screen_width: 1600, screen_height: 1200, size: 'page' }, 
		file, 65, { screen_width: `${options.screenWidth}`, screen_height: `${options.screenHeight}`, size: `${options.screenshotSize}`, name: `${options.batchName}` }, 
		function(batch) {
			fs.unlink(file, function() {});
			
			if (batch.status == 'error') {
				console.log("Batch failed: " + batch.error);
			}
			else {
				console.log(`Batch #${batch.id} in process`);
				
				// Check the status of the batch every 30 seconds
				timeout = setInterval(checkBatch , 1000 * 30, batch.id);
			}
		}
	);
}

function checkBatch(id) {
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
        //SEND THIS ARCHIVE TO EMAIL PROVIDED IN EMAIL INPUT FIELD
        console.log(`Downloading ${batch.urls[i]}  ...`);
        sendEmail2(batch.urls[i]).catch(console.error)
			}
		}
		else {
			console.log(`Waiting for batch ${batch.id} to finish`);
		}
	});
}

const sendEmail2 = async (url) => {
  console.log(url)
  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: `${process.env.HOST}`,
    port: process.env.EMAIL_PORT,
    secure: process.env.SECURE, // true for 465, false for other ports
    auth: {
      user: `${process.env.USERNAME}`,
      pass: `${process.env.EMAIL_PASSWORD}`
    },
  });

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: `${process.env.EMAIL}`, // sender address
    to: emailZip, // list of receivers
    subject: 'Here is your batch of screenshots!', // Subject line
    text: `Just click this link and you will be directed to save a .zip file to your device: ${url}`, // plain text body
    // html: "<b>Hello world?</b>", // html body
  });
  console.log("Message sent: %s", info.messageId);
}
