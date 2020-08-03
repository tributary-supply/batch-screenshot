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
var authToken;

//boilerplate
app.use(express.static(__dirname + '/'));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.get('/login', function(req,res){
  return res.render('login.ejs')
})

app.post('/index.js', (req, res) => {
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
app.post('/screenshot.js', verifyToken, (req, res) => {
  batchScreenShot(req.body.singleUrl)
  emailZip = req.body.sendZipEmail
  res.redirect('/')
})

app.listen(PORT, function(){
  console.log("Server is running on port 3000")
})




//UTIL PRIMARY FUNCTIONS-------------------------------------------------
function verifyToken(req, res, next) {
  // console.log("REQ", authToken)
  // const bearerHeader = req.headers['authorization'] // this comes up undefined!!!
  const bearerHeader = authToken // this comes up undefined!!!
  // console.log("bearerheader", bearerHeader)
  if (typeof bearerHeader !== undefined){
    const bearerToken = bearerHeader.split(' ')[1]
    req.token = bearerToken
    next()
  } else {
    res.sendStatus(403); //forbidden
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
        sendEmail(batch.urls[i])
			}
		}
		else {
			console.log(`Waiting for batch ${batch.id} to finish`);
		}
	});
}

const sendEmail = (url) => {
  var transporter = nodemailer.createTransport({
    service: 'gmail',
    // secure: false,
    auth: {
      user: `${process.env.EMAIL}`,
      pass: `${process.env.EMAILPASSWORD}`
    }
  });
  
  var mailOptions = {
    from: `${process.env.MAIL}`,
    to: emailZip,
    subject: 'Here is your batch of screenshots!',
    text: `Just click this link and you will be directed to save a .zip file to your device: ${url}`
  };
  
  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
}