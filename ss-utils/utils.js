const fs = require("fs");
var validator = require('validator');
const { DownloaderHelper } = require('node-downloader-helper');
const decompress = require('decompress');
var rimraf = require("rimraf");
const browshot = require('browshot');
const pptxgen = require('pptxgenjs');
const sgMail = require('@sendgrid/mail');


var client = new browshot(`${process.env.BROWSHOT_API_KEY}`);
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function createPPT(files, zipURL, inputData){
  let dirs = 0;
  // 1. Create a new Presentation
  const dataArr = inputData.batchUrls.split(" ").filter(i => i)
  console.log(dataArr)
  let pres = await new pptxgen();
  // 2. Add a Slide
  for (i=0;i<files.length-1;i++){
    console.log('FILE TYPE',files[i].type)
    if (files[i].type == 'directory'){
      dirs += 1;
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
          w: 10,
          h: 6,
        }
      }
      )
      .addText(`ASID/URL: \n ${dataArr[i - dirs]}`, { x: 0, y: 0, w: "30%", h: 1.4, fill: "ffffff", color: "666666", margin: 1 })
      console.log("slide created")
    }
  }
  await pres.writeFile(`${__dirname}/${inputData.batchName}.pptx`)
  console.log(`${inputData.batchName}.pptx saved`)
  //delete the folder with images
  await rimraf("dist", await function () { console.log("dist deleted"); });
  console.log(zipURL, inputData)
  let batchName = inputData.batchName ? inputData.batchName : "batch"
  await sendMail(zipURL, inputData, batchName)
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

    let files = await decompress('ss-utils/zipFolder.zip', 'dist')
    await fs.unlink('ss-utils/zipFolder.zip', (err) => {
      if (err) throw err;
      console.log('zip folder was deleted: PROCESS FINISHED');
    });

    await createPPT(files, zipURL, data)


  } catch (error) {
    // console.log("ERROR: ", error);
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

function formatData(data){
  const dataArr = data.split(" ").filter(i => i)
  for (i = 0; i < dataArr.length; i++){
    //if it's not a url, it must be an ASID, so add the url
    if (!validator.isURL(dataArr[i])){
      dataArr[i] = `https://amazon.com/dp/${dataArr[i]}\n`
    } else {
      //otherwise just return it
      dataArr[i] = `${dataArr[i]}\n`
    }
    //check if the URL exists???
  }
  return dataArr.join('')
}

//SENDGRID MAIL
const sendMail = async(url, inputData) => {
  console.log("INTO SENDMAIL SS")
  pathToAttachment = `${__dirname}/${inputData.batchName}.pptx`;
  console.log("pathToAttachment", pathToAttachment)
  attachment = await fs.readFileSync(pathToAttachment).toString("base64");
  const msg = {
    to: inputData.sendZipEmail,
    // to: `${inputData.sendZipEmail}`,
    from: 'admin@sgy.co', // Use the email address or domain you verified above
    subject: `${inputData.batchName} --- Here is your batch of screenshots!`,
    // text: `${inputData.batchName} \n${inputData.batchUrls}\n\nThe PPTX file is attached!\n -OR- \nJust click this link and you will be directed to save a .zip file to your device: \n${url}`,
    html: `
      <h1>${inputData.batchName}</h1>
      <h3>The PPTX file is attached!</h3>
      <p>Here is a .zip of all screenshots <a href="${url}">Click Here!</a></p>
      <p> ${inputData.message} </p>
      <h4>ASID/URL List:</h4>
      <p> ${inputData.batchUrls} </p>
      `,
    attachments: [
      {
        content: attachment,
        fileName: `${inputData.batchName}.pptx`,
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
  await fs.unlink(`ss-utils/${inputData.batchName}.pptx`, (err) => {
    if (err) throw err;
    console.log(`${inputData.batchName} ppt was deleted`);
  });
}

module.exports = {
  downloadThenDecompress : downloadThenDecompress,
  batchScreenShot : batchScreenShot,
  submitBatch : submitBatch,
  checkBatch : checkBatch,
  formatData : formatData,
  createPPT : createPPT,
  sendMail : sendMail
}