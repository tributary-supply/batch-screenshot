var CronJob = require('cron').CronJob;
const fetch = require('node-fetch');

(() => {
  var job = new CronJob('0 */1 * * * *', function() {
  
    fetch('https://trib-supply-amazon-scraper.herokuapp.com/')
        .then(res => console.log(`response-ok: ${res.ok}, status: ${res.status}`))
        .catch(err => console.log(err));
  
    console.log('ping');
  
  }, null, true, 'America/Los_Angeles');
  
  job.start();
  
})()