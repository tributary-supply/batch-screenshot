const puppeteer = require('puppeteer')
const csv = require('./csv');

const scrapeCompareList = async (dataFromCsv, pageNum) => {
  const formattedUrlsArr = await formatCompareData(dataFromCsv)
  // console.log(formattedUrlsArr)
  let scrapedData = []
  await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080','--user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36"'] })
  .then(async browser => {
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(0);

    // for (i = 1; i < 3; i++) { //FOR TESTING
    for (i = 0; i < formattedUrlsArr.length; i++) { //THIS NEEDS WORK HOW TO PAGINATE
      console.log(`working on ${i+1} of ${formattedUrlsArr.length} ... of Page Number ${pageNum} `,formattedUrlsArr[i].asin)
      // console.log(formattedUrlsArr[i].asin, formattedUrlsArr[i].ref1, formattedUrlsArr[i].ref2, formattedUrlsArr[i].ref3)
      const evalMain = await pageEvaluation(page, formattedUrlsArr[i].asin)
      const evalRef1 = formattedUrlsArr[i].ref1 !== null ? await pageEvaluation(page, formattedUrlsArr[i].ref1) : null
      const evalRef2 = formattedUrlsArr[i].ref2 !== null ? await pageEvaluation(page, formattedUrlsArr[i].ref2) : null
      const evalRef3 = formattedUrlsArr[i].ref3 !== null ? await pageEvaluation(page, formattedUrlsArr[i].ref3) : null

      // console.log(evalMain, evalRef1, evalRef2, evalRef3)
      scrapedData.push({
        asin: evalMain.asin,
        price: evalMain.price,
        reveiws: evalMain.reviews,
        packSize: evalMain.packSize,

        ref1: evalRef1 !== null ? evalRef1.asin : null,
        ref1Price: evalRef1 !== null ? evalRef1.price : null,
        ref1Reviews: evalRef1 !== null ? evalRef1.reviews : null,
        ref1PackSize: evalRef1 !== null ? evalRef1.packSize : null,
        
        ref2: evalRef2 !== null ? evalRef2.asin : null,
        ref2Price: evalRef2 !== null ? evalRef2.price : null,
        ref2Reviews: evalRef2 !== null ? evalRef2.reviews : null,
        ref2PackSize: evalRef2 !== null ? evalRef2.packSize : null,
        
        ref3: evalRef3 !== null ? evalRef3.asin : null,
        ref3Price: evalRef3 !== null ? evalRef3.price : null,
        ref3Reviews: evalRef3 !== null ? evalRef3.reviews : null,
        ref3PackSize: evalRef3 !== null ? evalRef3.packSize : null,
      })
    }
  })
  return scrapedData
}

const pageEvaluation = async (page, url) => {
  // let scrapedData = []
  let asin = url.split('dp/')[1]
  // console.log("URL", asin)
  await page.goto(url, {
    waitUntil: 'load',
    timeout: 0 // Remove the timeout
  });
  await page.waitForSelector('body');
  var productInfo = await page.evaluate(async (asin) => {
    let price, reviews, packSize
    price = document.querySelector('#priceblock_saleprice') !== null ? document.querySelector('#priceblock_saleprice').innerText 
        : document.querySelector('#priceblock_ourprice') !== null ? document.querySelector('#priceblock_ourprice').innerText 
        : document.querySelector('#priceblock_dealprice') !== null ? document.querySelector('#priceblock_dealprice').innerText : null;

    reviews = document.querySelector('#acrCustomerReviewText') ? document.querySelector('#acrCustomerReviewText').innerText : null
    
    let technicalDetails = document.querySelectorAll('#productDetails_techSpec_section_1 tbody tr') || null;  //all tech details
    if(technicalDetails !== null){
      technicalDetails.forEach(detail => {
        if(detail.innerText.includes('Size') || detail.innerText.includes('Package')){
          packSize = detail.innerText.replace(/\D/g,'');
          // packSize = detail.innerText.split('\t')[1];
          // if(packSize.includes("Pack")){
          //   packSize = packSize.split('Pack of ')[1]
          // }
        }
      })
    }

    const product = {
      // asin: asin,   //not coming through
      price: price,
      reviews: reviews == null ? null : reviews.split(' ')[0],
      packSize: packSize
    }
    return product
  })
  productInfo.asin = asin
  return productInfo
}




const scrape = async (data) => {
  const formattedUrlsArr = await formatData(data)
  //this arr is for data objs from all urls
  let scrapedData = []
  await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080','--user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36"'] })
  .then(async browser => {
    //loop through the urls
    const page = await browser.newPage();
    // page.on('console', msg => console.log(msg.text()))
    await page.setDefaultNavigationTimeout(0);

    for (i = 0; i < formattedUrlsArr.length; i++) {
      console.log(`working on ${i+1} of ${formattedUrlsArr.length} ... `,formattedUrlsArr[i])
      await page.goto(formattedUrlsArr[i], {
        waitUntil: 'load',
        timeout: 0 // Remove the timeout
      });
      await page.waitForSelector('body');

      // let aisnOrig = formattedUrlsArr[i]
      let reviewsLink;
      
      var productInfo = await page.evaluate(async () => {
        
        let errorText, title, price, images, stars, style, byLine, category, asin, buyBox, shipsFrom, availability, description, altImgs, hasAPlusContent, ratingCount, features, formattedFeatures, packSize;
        

        if(document.querySelector('#g > div > a > img') && document.querySelector('#g > div > a > img').alt.includes('Sorry')){
          errorText = true
          console.log("IMAGE ALT", document.querySelector('#g > div > a > img').alt)
        } else {
          errorText = false
        
          title = document.querySelector('#productTitle') !== null ? document.querySelector('#productTitle').innerText : null
          price = document.querySelector('#priceblock_saleprice') !== null ? document.querySelector('#priceblock_saleprice').innerText 
            : document.querySelector('#priceblock_ourprice') !== null ? document.querySelector('#priceblock_ourprice').innerText 
            : document.querySelector('#priceblock_dealprice') !== null ? document.querySelector('#priceblock_dealprice').innerText
            : document.querySelector('.apexPriceToPay') != null ? document.querySelector('.apexPriceToPay span').innerText : null;
          images = document.querySelector('.a-dynamic-image') !== null ? document.querySelector('.a-dynamic-image').src : null

          stars = document.querySelector('.a-icon-alt') !== null ? document.querySelector('.a-icon-alt').innerText: null
          stars = stars !== null ? stars.split(' ')[0] : null

          style = document.querySelector('.selection') !== null ? document.querySelector('.selection').innerText : null;
          byLine = document.querySelector('#bylineInfo') !== null ? document.querySelector('#bylineInfo').innerText : null
          category = document.querySelector('#wayfinding-breadcrumbs_feature_div ul li:last-child span a') !== null ? document.querySelector('#wayfinding-breadcrumbs_feature_div ul li:last-child span a').innerText : null
          asin = document.querySelector('#productDetails_detailBullets_sections1 tbody tr:first-child td') !== null ? document.querySelector('#productDetails_detailBullets_sections1 tbody tr:first-child td').innerText : null

          buyBox = document.querySelector('#buy-now-button') !== null ? 'yes': null

          shipsFrom = document.querySelector('#tabular-buybox > div.tabular-buybox-container > div:nth-child(2) > div > span') !== null ? document.querySelector('#tabular-buybox > div.tabular-buybox-container > div:nth-child(2) > div > span').innerHTML.includes('Amazon.com') ? 'yes': null : null;
          availability = document.querySelector('#availability span') !== null ? document.querySelector('#availability span').innerText : null
          
          description = document.querySelector('#productDescription') !== null ? document.querySelector('#productDescription') : null
          altImgs = document.querySelectorAll('#altImages > ul .item') !== null ? document.querySelectorAll('#altImages > ul .item') : null
          hasAPlusContent = document.querySelector('#aplus_feature_div') ? "yes" : null
          ratingCount = document.querySelector('#acrCustomerReviewText') ? document.querySelector('#acrCustomerReviewText').innerText : null
          
          reviewsLink = document.querySelector('#cr-pagination-footer-0 > a') !== null ? document.querySelector('#cr-pagination-footer-0 > a').getAttribute('href') : document.querySelector('#reviews-medley-footer > div > a') !==null ? document.querySelector('#reviews-medley-footer > div > a').getAttribute('href') : null;

          let technicalDetails = document.querySelectorAll('#productDetails_techSpec_section_1 tbody tr') || null;  //all tech details
          if(technicalDetails !== null){
            technicalDetails.forEach(detail => {
              if(detail.innerText.includes('Size')){
                packSize = detail.innerText.split('\t')[1]; 
              }
            })
          }

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

        var product;
        if(errorText == true){
          product = {'asin': errorText, 'errorText': true}
        } else {
          product = { 
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
            "packSize": packSize
  
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
      console.log(productInfo)
      productInfo.origAsin = formattedUrlsArr[i].split("/dp/")[1]

      if(productInfo.reviewCount){
        await page.goto(`https://www.amazon.com${productInfo.reviewCount}`);
        await page.waitForSelector('body');
  
        productInfo.reviewCount = await page.evaluate(async () => {
          let result = await document.querySelector('#filter-info-section div span').innerText
          result = result.split(' | ')[1].split(' ')[0]
          return result
        })
      }

      await scrapedData.push(productInfo);
      // productInfo.relatedProducts.forEach(product =>{
      //   scrapedData.push(product)
      // })
    }
    // page.close();
    await browser.close();
  }).catch(function(error) {
    console.error(error);
  });

  await console.log('finished')
  return scrapedData
}





async function findIssues(data){
  let issueData = []
  data.map(item => {
    if(item.price == null || item.buyBox == null || item.shipsFrom == null || item.shipsFrom !== "yes" || item.availability !== 'In Stock.'){
      let data = {
        URL: `https://www.amazon.com/dp/${item.asin}`,
        asin: item.asin,
        origAsin: item.origAsin,
        title: item.title,
        price: item.price,
        buyBox: item.buyBox,
        shipsFrom: item.shipsFrom,
        availability: item.availability,
        issueDayCount: item.issueDayCount,
        timesFixed: item.timesFixed,
        firstIssueDate: item.firstIssueDate.toString(),
        // issueField: item.issueField,
      }
      for (const prop in item) { //add issue fields
        if(prop.includes('Issue')){
          data[prop] = item[prop]
        }
      }
      issueData.push(data)
    }
  })
  return issueData
}

async function findFixed(data){
  let fixedData = []
  data.map(item => {
    // console.log( item.asin, 'issuedaycount', item.issueDayCount, 'timesfixed', item.timesFixed, 'issuefield', item.issueField) //HELPFUL CLG-----------------
    if(item.issueDayCount !== null && isNaN(item.issueDayCount) && item.issueDayCount.includes("Fixed")){
      let data = {
        URL: `https://www.amazon.com/dp/${item.asin}`,
        asin: item.asin,
        origAsin: item.origAsin,
        title: item.title,
        price: item.price,
        buyBox: item.buyBox,
        shipsFrom: item.shipsFrom,
        availability: item.availability,
        issueDayCount: item.issueDayCount,
        timesFixed: item.timesFixed,
        firstIssueDate: item.firstIssueDate ? item.firstIssueDate.toString() : 'firstissuedatedidntexit',
        // issueField: item.issueField
      }
      for (const prop in item) { //add issue fields
        if(prop.includes('Issue')){
          data[prop] = item[prop]
        }
      }
      fixedData.push(data)
    }
  })
  // console.log("fixed DATA", fixedData)
  return fixedData
}

function formatData(dataArr){
  // const dataArr = data.split(" ").filter(i => i)
  for (i = 0; i < dataArr.length; i++){
    //SHOULD CHECK HERE TO SEE IF IT IS AN AMAZON URL

    //if it's not a url, it must be an ASID, so add the url
    // if (!validator.isURL(dataArr[i])){
      dataArr[i] = `https://amazon.com/dp/${dataArr[i]}`
    // } else {
    //   //otherwise just return it
    //   dataArr[i] = `${dataArr[i]}`
    // }
  }
  // return dataArr.join('')
  return dataArr
}
function formatCompareData(dataArr){
  for (i = 0; i < dataArr.length; i++){
    // console.log("ERROR DATA", dataArr[i].ref1, dataArr[i].ref2, dataArr[i].ref3, typeof( dataArr[i].ref3) )

    dataArr[i].asin = `https://amazon.com/dp/${dataArr[i].asin}`
    dataArr[i].ref1 = dataArr[i].ref1 !== null ? `https://amazon.com/dp/${dataArr[i].ref1}` : null
    dataArr[i].ref2 = dataArr[i].ref2 !== null ? `https://amazon.com/dp/${dataArr[i].ref2}` : null
    dataArr[i].ref3 = dataArr[i].ref3 !== null ? `https://amazon.com/dp/${dataArr[i].ref3}` : null;
  }
  // console.log(dataArr)
  return dataArr
}

module.exports = {
  scrape,
  findIssues,
  findFixed,
  scrapeCompareList
}