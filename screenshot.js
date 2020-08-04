require('dotenv').config();
var PORT = process.env.PORT || 3000;
var express = require('express');
const bodyParser = require("body-parser");
const ejs = require('ejs');
const jwt = require('jsonwebtoken')
const browshot = require('browshot');
const fs = require("fs");
var validator = require('validator');
var nodemailer = require('nodemailer');
// const { JsonWebTokenError } = require('jsonwebtoken');

var app = express();
var client = new browshot(`${process.env.BROWSHOT_API_KEY}`);
var timeout;
var emailZip = '';
var authToken = undefined;
// const isLogged = false;

//boilerplate
app.use(express.static(__dirname + '/'));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

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
    jwt.sign({pw : pw}, "secretkey", (err, token) => {
      console.log("token", token)
      authToken = token
      res.json({
        token,
      })
    })
    isLogged = true;
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
  batchScreenShot(req.body.singleUrl)
  emailZip = req.body.sendZipEmail
  res.redirect('/success')
})

app.listen(PORT, function(){
  console.log("Server is running on port 3000")
})




//UTIL PRIMARY FUNCTIONS-------------------------------------------------
function verifyToken(req, res, next) {
  const bearerHeader = authToken // this comes up undefined!!!
  if (bearerHeader !== undefined){
    const bearerToken = bearerHeader.split(' ')[1]
    req.token = bearerToken
    next()
  } else {
    // res.sendStatus(403); //forbidden
    res.redirect('/login')
  }
}



const batchScreenShot = (data) => {
  const submittedData = formatData(data)
  console.log("SUBMITTED",submittedData)
  fs.writeFile("batch.txt", `${submittedData}`, (err) => {
    if (err) {
      console.log(`Failed to write list of URLs batch.txt: ${err}`);
    }
    else {
      console.log("WRITTEN!!!!")
      // sendEmail2('HERES THE URL')
      submitBatch("batch.txt");
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

function submitBatch(file) {
	client.batchCreate(
		file, 65, { screen_width: 1600, screen_height: 1200, size: 'page' }, 
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
			for(var i in batch.urls) {
        //SEND THIS ARCHIVE TO EMAIL PROVIDED IN EMAIL INPUT FIELD
        console.log(`Downloading ${batch.urls[i]}  ...`);
        // sendEmail(batch.urls[i])
        sendEmail2(batch.urls[i])
			}
		}
		else {
			console.log(`Waiting for batch ${batch.id} to finish`);
		}
	});
}

// const sendEmail = (url) => {
//   var transporter = nodemailer.createTransport({
//     service: 'gmail',
//     // secure: false,
//     auth: {
//       user: `${process.env.EMAIL}`,
//       pass: `${process.env.EMAILPASSWORD}`
//     }
//   });
  
//   var mailOptions = {
//     from: `${process.env.MAIL}`,
//     to: emailZip,
//     subject: 'Here is your batch of screenshots!',
//     text: `Just click this link and you will be directed to save a .zip file to your device: ${url}`
//   };
  
//   transporter.sendMail(mailOptions, function(error, info){
//     if (error) {
//       console.log(error);
//     } else {
//       console.log('Email sent: ' + info.response);
//     }
//   });
// }

  // async..await is not allowed in global scope, must use a wrapper
const sendEmail2 = async (url) => {
  console.log(url)
  // Generate test SMTP service account from ethereal.email
  // Only needed if you don't have a real mail account for testing
  // let testAccount = await nodemailer.createTestAccount();

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: `${process.env.EMAIL}`,
      pass: `${process.env.EMAILPASSWORD}`
    },
  });

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: `${process.env.MAIL}`, // sender address
    to: emailZip, // list of receivers
    subject: 'Here is your batch of screenshots!', // Subject line
    text: `Just click this link and you will be directed to save a .zip file to your device: ${url}`, // plain text body
    // html: "<b>Hello world?</b>", // html body
  });

  console.log("Message sent: %s", info.messageId);
  // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

  // Preview only available when sending through an Ethereal account
  // console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
}
  
// main().catch(console.error);

