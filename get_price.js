// const https = require('https');
// const cheerio = require('cheerio');


// function get_product(id) {
//         const options = {
//         hostname: 'www.kanbkam.com',
//         port: 443,
//         path: `/eg/ar/toshiba-r03kgb-sp2tgc-heavy-duty-aaa-carbon-zinc-batteries-15-v-2-pieces-${id}`,
//         method: 'GET',
//         headers: {
//             'Cookie': `search=%5B1724915056%2Cnull%5D; productViewed=%5B1724915056%2C%22${id}%22%2C%22B0CPD6XTK6%22%5D; XSRF-TOKEN=eyJpdiI6ImVWUDhmMkRjUEdGK3JJb0ZSTlROWnc9PSIsInZhbHVlIjoibGFDU2V6VzJtTjVGTG9oM2FPaDZ6OWJDQ2FzK2ZwVkdSNTFwOWNkOTlBK1ZHOUhZTTZKVWp6dFRZNHU3dnRsaURyRHhvK3hxcFE2cHFYNGw5T2phZnc9PSIsIm1hYyI6IjgxYzI5OTFmNTUxMzE3Nzc2ZTMzNjBmOWQ0ZDk1YzBkMDMyZGY0Y2VkNmRiY2EyNGFlY2QwMzNhYTJmM2RmMTUifQ%3D%3D; laravel_session=eyJpdiI6IlwvblpSYW13bmZRYTE5MTN2bHk2aHdRPT0iLCJ2YWx1ZSI6IlwvZTU1NHUyYitobnhvZENCbDl4SkFyeXAyTjQ5VU9BR3hvVXpMVzdKXC9uT0lQNFJvdUxjekJ3XC9zVlBcL29BRm45THlxWkFHYUt0YXRcL1QxQmFZZFgyN0E9PSIsIm1hYyI6ImRmNTUxYjQyOTIwMWEzOTc0MjZiYWUyZjkwNzQ4MjQ2NmM5N2MyYmQzMDRiMmY2MDdmMjk1Mjg0NmVmNDhhOGIifQ%3D%3D; NB_SRVID=srv476955`,
//             'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:129.0) Gecko/20100101 Firefox/129.0',
//             'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/png,image/svg+xml,*/*;q=0.8',
//             'Accept-Language': 'en-US,en;q=0.5',
//             'Accept-Encoding': 'gzip, deflate, br',
//             'Referer': 'https://www.kanbkam.com/eg/ar/exon-x1130-usb-30-male-adapter-usba-to-usb-31-female-adapter-typec-mulit-color-B0CPD6XTK6',
//             'Upgrade-Insecure-Requests': '1',
//             'Sec-Fetch-Dest': 'document',
//             'Sec-Fetch-Mode': 'navigate',
//             'Sec-Fetch-Site': 'same-origin',
//             'Sec-Fetch-User': '?1',
//             'Priority': 'u=0, i',
//             'Te': 'trailers'
//         }
//         };

//         const req = https.request(options, (res) => {
//         let data = '';

//         // A chunk of data has been received.
//         res.on('data', (chunk) => {
//             data += chunk;
//         });

//         // The whole response has been received. Now we can parse the HTML.
//         res.on('end', () => {
//             console.log(data);
//             const $ = cheerio.load(data);  // Load the HTML into cheerio

//             const minPrice = $('#min').text();  // Extract the text of the element with class 'old-price'
//             const maxPrice = $('#max').text();  // Extract the text of the element with class 'old-price'
//             const currentPrice = $('#priceNumber').text();  // Extract the text of the element with class 'old-price'

//             console.log('Old Price:', minPrice , maxPrice , currentPrice);  // Output the extracted data
//         });



//         });

//         // Handle any errors in the request
//         req.on('error', (e) => {
//         console.error(`Problem with request: ${e.message}`);
//         });

//         // End the request
//         req.end();
// }

// get_product("B0CTZXBH5B")


const https = require('https');
const zlib = require('zlib');  // For decompression
const cheerio = require('cheerio');
// Import the sqlite3 module
const sqlite3 = require('sqlite3').verbose();

// Connect to SQLite database (or create a new one)
let db = new sqlite3.Database('./products.db', (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});


function getProductsFromDB() {
    return new Promise((resolve, reject) => {
        db.all('SELECT id, price FROM products order by id', [], (err, row) => {
            
            if (err) {
                return reject(err);
            }
            resolve(row);  // If the product exists, `row` will contain the data
        });
    });
}

(async () => {
    let products = await getProductsFromDB()
    products = Array.from(products).slice(2000 , 2050  )
    products.forEach( async (p , i)=>{

       const product = await get_product_(p.id)

       
       //    console.log(p.price - price.previousPrice , p.id)
       console.log(product?.price?.current_price , p.price , p.id , i , product.item_available , product?.price?.current_price - p.price)
       
       if (product?.price?.current_price !== 0){
        // console.log(first)
        // console.log(product)
        // console.log(product?.price)
    }

       if (product?.price?.current_price){

            db.run('update products set price = ? where id = ? ', [product?.price?.current_price, p.id], function(err) {
               
            });
        }
      
        // console.log(price)
    })
    // console.log(products)
})()

// const https = require('https');
// const zlib = require('zlib');
// const cheerio = require('cheerio');

const amazonScraper = require('./lib/index');

const get_product_ = async  (id)=>{
    try {
    const product = await amazonScraper.asin({
        asin : id ,
        country : "EG"  ,
        randomUa : true
    });
   
    return product.result[0]
}catch {
    console.log(`failed to fetch ${id}`)
    return {}
}
    // const data = await get_product_price("B0BWWP9CXK")
    // console.log(data)
}


// get_product_("B09VXHYYPY")

function get_product_price(id) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'www.amazon.eg',
            path: `/dp/B08ZB7V28F`,
            method: 'GET',
            headers: {
                // 'Cookie': `search=%5B1724915056%2Cnull%5D; productViewed=%5B1724915056%2C%22${id}%22%2C%22B0CPD6XTK6%22%5D; XSRF-TOKEN=eyJpdiI6ImVWUDhmMkRjUEdGK3JJb0ZSTlROWnc9PSIsInZhbHVlIjoibGFDU2V6VzJtTjVGTG9oM2FPaDZ6OWJDQ2FzK2ZwVkdSNTFwOWNkOTlBK1ZHOUhZTTZKVWp6dFRZNHU3dnRsaURyRHhvK3hxcFE2cHFYNGw5T2phZnc9PSIsIm1hYyI6IjgxYzI5OTFmNTUxMzE3Nzc2ZTMzNjBmOWQ0ZDk1YzBkMDMyZGY0Y2VkNmRiY2EyNGFlY2QwMzNhYTJmM2RmMTUifQ%3D%3D; laravel_session=eyJpdiI6IlwvblpSYW13bmZRYTE5MTN2bHk2aHdRPT0iLCJ2YWx1ZSI6IlwvZTU1NHUyYitobnhvZENCbDl4SkFyeXAyTjQ5VU9BR3hvVXpMVzdKXC9uT0lQNFJvdUxjekJ3XC9zVlBcL29BRm45THlxWkFHYUt0YXRcL1QxQmFZZFgyN0E9PSIsIm1hYyI6ImRmNTUxYjQyOTIwMWEzOTc0MjZiYWUyZjkwNzQ4MjQ2NmM5N2MyYmQzMDRiMmY2MDdmMjk1Mjg0NmVmNDhhOGIifQ%3D%3D; NB_SRVID=srv476955`,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:129.0) Gecko/20100101 Firefox/129.0',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/png,image/svg+xml,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br',
                // 'Referer': 'https://www.kanbkam.com/eg/ar/exon-x1130-usb-30-male-adapter-usba-to-usb-31-female-adapter-typec-mulit-color-B0CPD6XTK6',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'same-origin',
                'Sec-Fetch-User': '?1',
                'Priority': 'u=0, i',
                'Te': 'trailers'
            }
        };

        const req = https.request(options, (res) => {
            let data = [];

            // Check content encoding
            const encoding = res.headers['content-encoding'];

            // Collect response data
            res.on('data', (chunk) => {
                data.push(chunk);
            });

            // Handle end of response
            res.on('end', () => {
                data = Buffer.concat(data);

                // Handle gzip or br decompression based on content encoding
                if (encoding === 'gzip') {
                    zlib.gunzip(data, (err, decompressed) => {
                        if (err) reject(err);
                        handleResponse(decompressed.toString());
                    });
                } else if (encoding === 'br') {
                    zlib.brotliDecompress(data, (err, decompressed) => {
                        if (err) reject(err);
                        handleResponse(decompressed.toString());
                    });
                } else {
                    handleResponse(data.toString());
                }
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        req.end();

        function handleResponse(html) {
            const $ = cheerio.load(html);
            // Adjust selectors according to actual page structure
            const minPrice = $('#min').text();
            const maxPrice = $('#max').text();
            const currentPrice = $('#priceNumber').text();
            const previousPrice = $('#previous').text();
            const rate = $('#rate').text();
            const available = $('.price-label.out-stock');
            const price = $('.a-price.a-text-normal.aok-align-center.reinventPriceAccordionT2 .a-price-whole').text();
            const isAvailable = $('#outOfStock').text();
            
            console.log(price , isAvailable.includes("غير متوفر حالياً."))
            const isHidden = available.attr('style') && available.attr('style').includes('display: none');
            console.log(isHidden === false)
            const rateNumber = rate === "جيد جداً" ? 3 : rate === "جيد" ? 2 : 1;
            
            const info = {
                minPrice, 
                previousPrice, 
                maxPrice, 
                currentPrice, 
                rateNumber , 
                available :isHidden === false
            };
            
            resolve(info); // Return the info object through the promise
        }
    });
}


// get_product_("B0BWWP9CXK")



// function get_product_price(id) {
//     return new Promise((resolve, reject) => {
//         const options = {
//             hostname: 'www.kanbkam.com',
//             path: `/eg/ar/toshiba-r03kgb-sp2tgc-heavy-duty-aaa-carbon-zinc-batteries-15-v-2-pieces-${id}`,
//             method: 'GET',
//             headers: {
//                 'Cookie': `search=%5B1724915056%2Cnull%5D; productViewed=%5B1724915056%2C%22${id}%22%2C%22B0CPD6XTK6%22%5D; XSRF-TOKEN=eyJpdiI6ImVWUDhmMkRjUEdGK3JJb0ZSTlROWnc9PSIsInZhbHVlIjoibGFDU2V6VzJtTjVGTG9oM2FPaDZ6OWJDQ2FzK2ZwVkdSNTFwOWNkOTlBK1ZHOUhZTTZKVWp6dFRZNHU3dnRsaURyRHhvK3hxcFE2cHFYNGw5T2phZnc9PSIsIm1hYyI6IjgxYzI5OTFmNTUxMzE3Nzc2ZTMzNjBmOWQ0ZDk1YzBkMDMyZGY0Y2VkNmRiY2EyNGFlY2QwMzNhYTJmM2RmMTUifQ%3D%3D; laravel_session=eyJpdiI6IlwvblpSYW13bmZRYTE5MTN2bHk2aHdRPT0iLCJ2YWx1ZSI6IlwvZTU1NHUyYitobnhvZENCbDl4SkFyeXAyTjQ5VU9BR3hvVXpMVzdKXC9uT0lQNFJvdUxjekJ3XC9zVlBcL29BRm45THlxWkFHYUt0YXRcL1QxQmFZZFgyN0E9PSIsIm1hYyI6ImRmNTUxYjQyOTIwMWEzOTc0MjZiYWUyZjkwNzQ4MjQ2NmM5N2MyYmQzMDRiMmY2MDdmMjk1Mjg0NmVmNDhhOGIifQ%3D%3D; NB_SRVID=srv476955`,
//                 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:129.0) Gecko/20100101 Firefox/129.0',
//                 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/png,image/svg+xml,*/*;q=0.8',
//                 'Accept-Language': 'en-US,en;q=0.5',
//                 'Accept-Encoding': 'gzip, deflate, br',
//                 'Referer': 'https://www.kanbkam.com/eg/ar/exon-x1130-usb-30-male-adapter-usba-to-usb-31-female-adapter-typec-mulit-color-B0CPD6XTK6',
//                 'Upgrade-Insecure-Requests': '1',
//                 'Sec-Fetch-Dest': 'document',
//                 'Sec-Fetch-Mode': 'navigate',
//                 'Sec-Fetch-Site': 'same-origin',
//                 'Sec-Fetch-User': '?1',
//                 'Priority': 'u=0, i',
//                 'Te': 'trailers'
//             }
//         };

//         const req = https.request(options, (res) => {
//             let data = [];

//             // Check content encoding
//             const encoding = res.headers['content-encoding'];

//             // Collect response data
//             res.on('data', (chunk) => {
//                 data.push(chunk);
//             });

//             // Handle end of response
//             res.on('end', () => {
//                 data = Buffer.concat(data);

//                 // Handle gzip or br decompression based on content encoding
//                 if (encoding === 'gzip') {
//                     zlib.gunzip(data, (err, decompressed) => {
//                         if (err) reject(err);
//                         handleResponse(decompressed.toString());
//                     });
//                 } else if (encoding === 'br') {
//                     zlib.brotliDecompress(data, (err, decompressed) => {
//                         if (err) reject(err);
//                         handleResponse(decompressed.toString());
//                     });
//                 } else {
//                     handleResponse(data.toString());
//                 }
//             });
//         });

//         req.on('error', (e) => {
//             reject(e);
//         });

//         req.end();

//         function handleResponse(html) {
//             const $ = cheerio.load(html);
//             // Adjust selectors according to actual page structure
//             const minPrice = $('#min').text();
//             const maxPrice = $('#max').text();
//             const currentPrice = $('#priceNumber').text();
//             const previousPrice = $('#previous').text();
//             const rate = $('#rate').text();
//             const available = $('.price-label.out-stock');
//             const isHidden = available.attr('style') && available.attr('style').includes('display: none');
//             console.log(isHidden === false)
//             const rateNumber = rate === "جيد جداً" ? 3 : rate === "جيد" ? 2 : 1;
            
//             const info = {
//                 minPrice, 
//                 previousPrice, 
//                 maxPrice, 
//                 currentPrice, 
//                 rateNumber , 
//                 available :isHidden === false
//             };
            
//             resolve(info); // Return the info object through the promise
//         }
//     });
// }

