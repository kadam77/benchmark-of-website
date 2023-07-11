const https = require('https');
const { performance } = require('perf_hooks');
const { resolve } = require('path');
const expressAsyncHandler = require('express-async-handler');
const { google } = require('googleapis');
const customsearch = google.customsearch('v1');
const apiKey = '';
const axios = require('axios');
const helmet = require('helmet');
const { JSDOM } = require('jsdom');
const puppeteer = require('puppeteer');

function measurePageLoadTime(url) {
  return new Promise((resolve, reject) => {
    const startTime = new Date();
    const startTime1 = performance.now();
    https.get(url, (response) => {
      response.on('data', () => { }); // Ignore the data event, we're interested in the 'end' event
      response.on('end', () => {
        const endTime = new Date();
        const loadTime = endTime - startTime;
        resolve(loadTime)
      })
    }).on('error', (error) => {
      console.error('Error:', error.message);
      reject(error)
      // res.status(500).json({ error: 'An error occurred' });
    });
  });
}
function ttfbParam(url) {
  return new Promise((resolve, reject) => {
    const startTime1 = performance.now();
    https.get(url, (response) => {
      response.on('data', () => { }); // Ignore the data event, we're interested in the 'end' event
      response.on('end', () => {
        
        const endTime1 = performance.now();
        const ttfb = endTime1 - startTime1;
        resolve(ttfb)
      })
    }).on('error', (error) => {
      console.error('Error:', error.message);
      reject(error)
      // res.status(500).json({ error: 'An error occurred' });
    });
  });
}
function checkBrowserCompatibility(url) {
  return new Promise((resolve) => {
    

    (async () => {
      const browser = await puppeteer.launch({ headless: "new" });
      //const page = await browser.newPage();

      // Define the list of browsers you want to test
      const browsers = [
        { name: 'Chrome', options: { headless: true } },
        { name: 'Firefox', options: { headless: true } },
        { name: 'Safari', options: { headless: true } },
        // Add more browsers here
      ];

      try {
        for (const browserConfig of browsers) {
          const { name, options } = browserConfig;
          console.log(`Testing ${name}...`);

          // Launch the browser
          const browser = await puppeteer.launch(options);
          const page = await browser.newPage();

          // Open the URL and perform necessary tests
          await page.goto(url);

          // Add your tests for appearance, functionality, or performance here

          // Close the browser
          await browser.close();

          console.log(`${name} testing completed.`);
        }

        resolve(true);
      } catch (error) {
        console.error('Error:', error);
        resolve(false);
      } finally {
        await browser.close();
      }
    })();
  });
}
function getWebsiteRank(searchQuery, targetWebsite) {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await customsearch.cse.list({
        auth: apiKey,
      
        cx: '', // Replace with your Custom Search Engine ID (CX)
        q: searchQuery
      });

      // Find the position (rank) of the target website in the search results
      const items = response.data.items || [];
      const rank = items.findIndex(item => item.link.includes(targetWebsite));

      if (rank !== -1) {
        resolve(rank + 1);
      } else {
        resolve("not found in top 10");
      }
    } catch (error) {
      reject(error);
      console.error('Error performing search:', error);
    }
  });
}
function benchmarkSecurity(websiteUrl) {
  return new Promise(async (resolve, reject) => {
    try {
      // Fetch website content
      const response = await axios.get(websiteUrl);
      const html = response.data;

      // Create a virtual DOM using jsdom
      const dom = new JSDOM(html);
      const window = dom.window;

      // Perform security checks
      const helmetHeaders = helmet.contentSecurityPolicy({});
      const sslEnabled = websiteUrl.startsWith('https://');
      const secureLogin = checkSecureLogin(window);
      // const xssProtection = checkXSSProtection(helmetHeaders);
      // const sqlInjectionProtection = checkSQLInjectionProtection(helmetHeaders);

      // Display the security results
      
      const securityResults = {
        'SSL Encryption': sslEnabled ? 'Enabled' : 'Not Enabled',
        'Secure Login System': secureLogin ? 'Secure' : 'Insecure'
      };

      resolve(securityResults);
    } catch (error) {
      console.error('Error benchmarking security:', error);
      reject(error);
    }
  });
}

function checkSecureLogin(window) {
  // Checking if the login form is served over HTTPS
  const loginForm = window.document.querySelector('#login-form');
  if (loginForm) {
    const loginFormAction = loginForm.getAttribute('action');
    if (loginFormAction && !loginFormAction.startsWith('https://')) {
      return false;
    }
  }

  // Checking if the login form is using secure cookies
  const cookies = window.document.cookie;
  if (cookies && !cookies.includes('Secure')) {
    return false;
  }

  return true;
}

function checkMobileResponsiveness(url) {
  return new Promise(async(resolve,reject)=>{
    try {
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
  
      // Emulate a mobile device
      const mobileViewport = puppeteer.devices['iPhone X'];
      await page.emulate(mobileViewport);
  
      await page.goto(url);
  
      // Capture a screenshot of the page
      const screenshotPath = 'mobile_screenshot.png';
      await page.screenshot({ path: screenshotPath });
  
      console.log('Mobile responsiveness screenshot captured:', screenshotPath);
  
      await browser.close();
      resolve(screenshotPath)
    } catch (error) {
      reject(error);
      console.error('Error checking mobile responsiveness:', error);
    }
  })
}


//@desc give the page load time
//@route GET /
//@access public
const homepage = (req,res)=>{
  const result = null; // Set the initial value of the result variable

  res.render('index.ejs', { result });
}
  


//@desc give the parameters
//@route POST /
//@access public
const benchmark = expressAsyncHandler(async (req, res) => {
  const  {url,searchQuery} = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is missing in the request body' });
  }

  if (!searchQuery) {
    return res.status(400).json({ error: 'searchQuery is missing in the request body' });
  }
  try {
  
//benchmark check

    // Measure page load time
    const pageLoadTime = await measurePageLoadTime(url);
    //measure time to first byte
    const ttfb = await ttfbParam(url)
    // Check browser compatibility
    const isCompatible = await checkBrowserCompatibility(url);
    //check if website ranks in top 10
    const rank = await getWebsiteRank(searchQuery, url);
    //security check
    const security = await benchmarkSecurity(url)
    //mobile responsiveness
    const mobile_responsiveness = await checkMobileResponsiveness(url)

    // Prepare the response
    const result = {
      pageLoadTime,
      isCompatible,
      ttfb,
      rank,
      mobile_responsiveness,
      security
    };

    res.status(200).json(result);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
}
)


module.exports = {
 benchmark,
 homepage
};
