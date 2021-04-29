const puppeteer = require('puppeteer')
const csv = require('./csv');


const scrape = async (data) => {
  const formattedUrlsArr = await formatData(data)
  console.log(formattedUrlsArr)
  // const formattedUrlsArr = ['https://www.amazon.com/dp/B07ZX6P2PT']

  //this arr is for data objs from all urls
  let scrapedData = []
  await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080','--user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36"'] })
  .then(async browser => {
    //loop through the urls
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(0);
    for (i = 0; i < formattedUrlsArr.length; i++) {
      console.log(`working on ${i+1} of ${formattedUrlsArr.length} ... `,formattedUrlsArr[i])
      await page.goto(formattedUrlsArr[i]);
      await page.waitForSelector('body');

      // let aisnOrig = formattedUrlsArr[i]
      // console.log("formattedUrlsArr",formattedUrlsArr[i])
      let reviewsLink;

      var productInfo = await page.evaluate(async () => {
        let title = document.querySelector('#productTitle') !== null ? document.querySelector('#productTitle').innerText : 'NULL'
        let price = document.querySelector('#priceblock_saleprice') !== null ? document.querySelector('#priceblock_saleprice').innerText : document.querySelector('#priceblock_ourprice') !== null ? document.querySelector('#priceblock_ourprice').innerText : 'NULL';
        let images = document.querySelector('.a-dynamic-image') !== null ? document.querySelector('.a-dynamic-image').src : `NULL`
        let stars = document.querySelector('.a-icon-alt') !== null ? document.querySelector('.a-icon-alt').innerText: `NULL`
        let style = document.querySelector('.selection') !== null ? document.querySelector('.selection').innerText : 'NULL';
        let byLine = document.querySelector('#bylineInfo') !== null ? document.querySelector('#bylineInfo').innerText : 'NULL'
        let category = document.querySelector('#wayfinding-breadcrumbs_feature_div ul li:last-child span a') !== null ? document.querySelector('#wayfinding-breadcrumbs_feature_div ul li:last-child span a').innerText : 'NULL'
        let asin = document.querySelector('#productDetails_detailBullets_sections1 tbody tr:first-child td') !== null ? document.querySelector('#productDetails_detailBullets_sections1 tbody tr:first-child td').innerText : "NULL"

        let buyBox = document.querySelector('#buy-now-button') !== null ? 'yes': 'NULL'
        let shipsFrom = document.querySelector('#tabular-buybox-container') !== null ? document.querySelector('#tabular-buybox-container').innerHTML.includes('Amazon.com') ? 'yes': 'NULL' : 'NULL';
        let availability = document.querySelector('#availability span') !== null ? document.querySelector('#availability span').innerText : 'NULL'
        
        let description = document.querySelector('#productDescription')
        let altImgs = document.querySelectorAll('#altImages > ul .item')
        let hasAPlusContent = document.querySelector('#aplus_feature_div') ? "yes" : "NULL"
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
          "buyBox": buyBox,
          "shipsFrom": shipsFrom,
          "availability": availability,
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
      // productInfo.origAsin = formattedUrlsArr[i].split("/dp/")[1]

      // console.log(`https://www.amazon.com${productInfo.reviewCount}`)
      await page.goto(`https://www.amazon.com${productInfo.reviewCount}`);
      await page.waitForSelector('body');

      productInfo.reviewCount = await page.evaluate(async () => {
        let result = await document.querySelector('#filter-info-section div span').innerText
        result = result.split(' | ')[1].split(' ')[0]
        return result
      })

      // console.log("prioductINFFOOO", productInfo)
      scrapedData.push(productInfo);
      // productInfo.relatedProducts.forEach(product =>{
      //   scrapedData.push(product)
      // })
    }
    // console.log("SCRAPE", scrapedData)
    // page.close();
    await browser.close();
  }).catch(function(error) {
    console.error(error);
  });
  
  //testing
  // let batchName = "batch"
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

  let batchName = data.batchName ? data.batchName : "batch"
  const issueProducts = await findIssues(scrapedData)

  //append issue products to database
  // await appendIssueProducts()

  // await csv.createErrorCSV(issueProducts, batchName)
  // await csv.createCSV(scrapedData, batchName)

  await console.log('finished')
  return scrapedData
}





async function findIssues(data){
  let issueData = []
  data.map(item => {
    console.log('availablitilty', item.availability, item.availability !== 'In Stock.')
    if(item.price == 'NULL' || item.buyBox == 'NULL' || item.shipsFrom == 'NULL' || item.availability !== 'In Stock.'){
      issueData.push({
        asin: item.asin,
        title: item.title,
        price: item.price,
        buyBox: item.buyBox,
        shipsFrom: item.shipsFrom,
        availability: item.availability
      })
    }
  })
  return issueData
}

function formatData(dataArr){
  // const dataArr = data.split(" ").filter(i => i)
  for (i = 0; i < dataArr.length; i++){
    //SHOULD CHECK HERE TO SEE IF IT IS AN AMAZON URL

    //if it's not a url, it must be an ASID, so add the url
    // if (!validator.isURL(dataArr[i])){
      dataArr[i] = `https://amazon.com/dp/${dataArr[i]}`
      // console.log('formatted url', dataArr[i])
    // } else {
    //   //otherwise just return it
    //   dataArr[i] = `${dataArr[i]}`
    // }
  }
  // return dataArr.join('')
  // console.log("FORMATTED",dataArr)
  return dataArr
}

module.exports = {
  scrape,
  findIssues
}