// https://sdk.apify.com/docs/examples/cheeriocrawler
// https://www.jishuwen.com/d/2Wqd/zh-tw
// https://alligator.io/tooling/puppeteer/
// https://www.tuicool.com/articles/i6V36zv
const Apify = require('apify');
const moment = require('moment');
const date = moment().format('YYYY/MM/DD');

// Apify.utils contains various utilities, e.g. for logging.
// Here we turn off the logging of unimportant messages.
const { log } = Apify.utils;
log.setLevel(log.LEVELS.WARNING);

const sources = [
    {
        url: 'https://www.ncaa.com/stats/football/fcs/current/team/21'
    },
    // {
    //     url: 'https://www.ncaa.com/stats/football/fcs/current/team/699'
    // },
    // {
    //     url: 'https://www.ncaa.com/stats/football/fcs/current/team/700'
    // },
];

const handlePageFunctionAlpha = async ({ request, page }) => {
    const dataset = await Apify.openDataset(`NCAA-${date}`);
    console.log('RUNNING')
    console.log(`Processing ${request.url}...`);
    // console.log(page)

    const pageFunction = (posts) => {
        const data = [];

        // We're getting the title, rank and URL of each post on Hacker News.
        posts.forEach(post => {
            data.push({
                title: post.querySelector('.title a').innerText,
                rank: post.querySelector('.rank').innerText,
                href: post.querySelector('.title a').href,
            });
        });

        return data;
    };

    const data = await page.$$eval('.athing', pageFunction);

    dataset.pushData(data);

    /*
        // Store the results to the default dataset.
        // await Apify.pushData(data);

        // Find the link to the next page using Puppeteer functions.

        let nextHref;
        try {
            nextHref = await page.$eval('.morelink', el => el.href);
        } catch (err) {
            console.log(`${request.url} is the last page!`);
            return;
        }


        // Enqueue the link to the RequestQueue
        await requestQueue.addRequest(new Apify.Request({ url: nextHref }));
      */
}

const handlePageFunctionBeta = async ({ page, request }) => {
    const dataset = await Apify.openDataset(`NCAA-${date}`);

    // This function is called to extract data from a single web page
    // 'page' is an instance of Puppeteer.Page with page.goto(request.url) already called
    // 'request' is an instance of Request class with information about the page to load

    const tableFunction = (elements) => {
        const data = [];
        const headerElements = elements.querySelectorAll('.tablesorter-header-inner')

        console.log(elements)

        // const team = [
        //     'RANK',
        //     'TEAM',
        //     'G',
        //     'PLAYS',
        //     'YDS',
        //     'YDS/PLAY',
        //     'OFF TDS',
        //     'YPG',
        // ];



        return data;
    };

    const headers = await page.$$eval('.stats-wrap .tablesorter-header-inner', elements => {
        const data = [];
        elements.forEach(element => {
            data.push(element.innerText)
        })
        return data
    });

    const teams = await page.$$eval('.stats-wrap tbody tr', elements => {
        const data = [];

        elements.forEach((element, i) => {

            const stats = element.querySelectorAll('td')
            const rank = element.querySelector('td').innerText
            data.push({
                'RANK': stats[0].innerText,
                'TEAM': stats[1].querySelector('.school').innerText,
                'G': stats[2].innerText,
                'PLAYS': stats[3].innerText,
                'YDS': stats[4].innerText,
                'YDS/PLAY': stats[5].innerText,
                'OFF TDS': stats[6].innerText,
                'YPG': stats[7].innerText,
            })
        })
        return data
    });

    await dataset.pushData({
        // title: title,
        teams,
        url: request.url,
        succeeded: true,
    })
}

const handleFailedRequestFunction = async ({ request }) => {
    console.log(`Request ${request.url} failed too many times`);
}

Apify.main(async () => {
    // Create and initialize an instance of the RequestList class that contains the start URL.
    const requestList = new Apify.RequestList({
        sources: sources,
    });

    await requestList.initialize();
    // Apify.openRequestQueue() is a factory to get a preconfigured RequestQueue instance.
    const requestQueue = await Apify.openRequestQueue();
    const crawler = new Apify.PuppeteerCrawler({
        requestList,
        requestQueue,
        launchPuppeteerOptions: {
            headless: true
        },
        handlePageFunction: handlePageFunctionBeta,
        handleFailedRequestFunction: handleFailedRequestFunction, // This function is called if the page processing failed more than maxRequestRetries+1 times.
    });

    // Run the crawler and wait for it to finish.
    await crawler.run();

    console.log('Crawler finished.');
});