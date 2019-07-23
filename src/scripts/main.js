// https://github.com/apifytech/apify-js/blob/master/examples/basic_crawler.js

const Apify = require('apify');
const requestPromise = require('request-promise');
const moment = require('moment')


// Apify.main() function wraps the crawler logic (it is optional).
Apify.main(async () => {
    // Create and initialize an instance of the RequestList class that contains
    // a list of URLs to crawl. Here we use just a few hard-coded URLs.
    const requestList = new Apify.RequestList({
        sources: [
            {
                url: 'https://www.ncaa.com/stats/football/fcs/current/team/21'
            },
            {
                url: 'https://www.ncaa.com/stats/football/fcs/current/team/699'
            },
            {
                url: 'https://www.ncaa.com/stats/football/fcs/current/team/700'
            },
        ],
    });
    await requestList.initialize();

    const date = moment().format('YYYY/MM/DD');
    console.log(date)

    const dataset = await Apify.openDataset(`NCAA-${date}`);
    const handleRequestFunction = async ({ request, page }) => {
        console.log(`Processing ${request.url}...`);

        // Fetch the page HTML
        const html = await requestPromise(request.url);
        await dataset.pushData({
            url: request.url,
            html,
        });
    }

    const crawler = new Apify.BasicCrawler({
        requestList,
        handleRequestFunction: handleRequestFunction,
    });

    // Run the crawler and wait for it to finish.
    await crawler.run();

    console.log('Crawler finished.');
});