require('dotenv').config();
var express = require('express');
const bodyParser = require("body-parser");
const ejs = require('ejs');
var app = express();
const browshot = require('browshot');
const fs = require("fs");
var validator = require('validator');

var client = new browshot(`${process.env.BROWSHOT_API_KEY}`);
var timeout;

// console.log(process.env.BROWSHOT_API_KEY)

//boilerplate
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
//serves up the form page by rendering index.ejs to '/'
app.get('/', function(req, res){
  return res.render('index.ejs')
})
//sends data from form to testpost.js and then redirects back to the form page
app.post('/testPost.js', (req, res) => {
  // console.log(req.body.singleUrl)
  batchScreenShot(req.body.singleUrl)
  // screenShot(req.body.singleUrl)
  res.redirect('/')
})

app.listen(3000, function(){
  console.log("Server is running on port 3000")
})


//UTIL PRIMARY FUNCTIONS-------------------------------------------------
const batchScreenShot = (data) => {
  const submittedData = formatData(data)
  console.log("SUBMITTED",submittedData)
  fs.writeFile("batch.txt", `${submittedData}`, (err) => {
    if (err) {
      console.log(`Failed to write lsit of URLs batch.txt: ${err}`);
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
  // console.log(data)
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
			}
		}
		else {
			console.log(`Waiting for batch ${batch.id} to finish`);
		}
	});
}