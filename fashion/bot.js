

const TelegramBot = require('node-telegram-bot-api');


// Import the sqlite3 module
const sqlite3 = require('sqlite3').verbose();

// Connect to SQLite database (or create a new one)
let db = new sqlite3.Database('./fashion/fashion_products.db', (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});


const token = '7119647204:AAHMeAiN-MB0LjuazlnnDsyJnaTkPTTOh08';
// const token = '7440148973:AAGpsaMcbd1OYLIzh8yR8lwAAZzyMVkdqbg';
const bot = new TelegramBot(token, { polling: true });



let chatIds = [805411613  ] //963705880 , 6312816792
const keywords = "ابجكلميى"
let index = 10

function getKeyword() {
    index  = ( index + 1) % keywords.length
    return keywords[index]
}

const fs = require('fs');
const path = './fashion/sentProducts.json'; // Path to the file that stores sent data

async function sendMessage() {
    try {
        const products = await getDiscountedProducts(getKeyword(), "fashion");
        // console.log(products)
        let result = "";
        const today = new Date().toISOString().split('T')[0]; // Get today's date as YYYY-MM-DD

        // Load previously sent data
        let sentData = {};
        if (fs.existsSync(path)) {
            sentData = JSON.parse(fs.readFileSync(path, 'utf8'));
        }

        if (products.length) {
            products.forEach((product, index) => {
                const productInfo = `URL number ${index + 1}: ${product.url} - was ${product.price.current_price} be ${product.price.before_price}`;
                const productRecord = sentData[today]?.find(item => item.url === product.url);

                // Check if the product has been sent today, and if the price has changed
                if (!productRecord || productRecord.currentPrice !== product.currentPrice) {
                    result += productInfo + "\n";

                    // Add or update the product entry for today's sent data
                    if (!sentData[today]) {
                        sentData[today] = [];
                    }
                    
                    if (productRecord) {
                        // Update the price if the product already exists for today
                        productRecord.currentPrice = product.currentPrice;
                    } else {
                        // Add a new record if the product hasn't been sent today
                        sentData[today].push({
                            url: product.url,
                            prevPrice:product.price.before_price ,
                            currentPrice: product.price.current_price
                        });
                    }
                }
            });

            // Write updated sent data back to the file
            fs.writeFileSync(path, JSON.stringify(sentData), 'utf8');
        }

        // Send the message only if there is new data
        for (let chatId of chatIds) {
            if (result) {
                bot.sendMessage(chatId, result);
            } else {
                console.log("No Result")
                // bot.sendMessage(chatId, "no result ");
            }
        }

    } catch (error) {
        console.log("error happen", error);
    }
}

setInterval(sendMessage,  2 * 60 * 1000);





const amazonScraper = require('../lib/index');




let turn = true
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

async function getDiscountedProducts (keyword , category = "")  {
    console.log(keyword , category)

    let products = []
    if(turn) {
        products = await amazonScraper.products({
            keyword: keyword , 
            number: 75,
            country: 'EG' ,
            category : category
        });
        products = products.result
    }else {
        products = await getProductsFromDB()
        products = shuffleArray(products)
        products = products.slice(0 , 30)
    }

    const productIds = products.map((p) => p.asin || p.id)
    console.log(productIds)
    let discountedProducts = [];

    for (const product of products) {
        try {
        // console.log(product.item_available)
        var productId = product.asin || product.id;  
        let productFromAmazon = await get_product_by_asin(productId)
        const current_price = productFromAmazon?.price?.current_price  || product?.price?.current_price || product?.price
        const dbProduct = await getProductFromDB(productId);
        let beforePrice = current_price

        if(!productFromAmazon.item_available) {
            continue
        }
        if (dbProduct) {
            beforePrice = dbProduct.price 

            if(current_price &&  current_price < beforePrice * 0.8) {
                discountedProducts.push(productFromAmazon);
            }else if (beforePrice > current_price) {
                await updateProductPrice(productId , current_price)
            }
        } else {
            if(current_price){
                addProductToDB(productId, current_price); 
            }

            const price_from_kanbkam =  await get_product_price(productId)
            if (price_from_kanbkam.rate ===3 ){
                discountedProducts.push(price_from_kanbkam)
            }
            
        }
        productFromAmazon.price.before_price = beforePrice
    }catch {
        console.log(`error in ${productId} ${turn}`)
    }

    }
    turn = !turn

    return discountedProducts;
  
};


function getProductFromDB(id) {
    return new Promise((resolve, reject) => {
        db.get('SELECT id, price FROM products WHERE id = ?', [id], (err, row) => {
            if (err) {
                return reject(err);
            }
            resolve(row);  // If the product exists, `row` will contain the data
        });
    });
}

function addProductToDB(id, price) {
    return new Promise((resolve, reject) => {
        db.run('INSERT INTO products (id, price) VALUES (?, ?)', [id, price], function(err) {
            if (err) {
                return reject(err);
            }
            resolve();
        });
    });
}
function updateProductPrice(id, price) {
    return new Promise((resolve, reject) => {
        db.run('update products set price = ? where id = ? ', [price.previousPrice, p.id], function(err) {
            if (err) {
                return reject(err);
            }
            resolve();
        });
    });
}




const https = require('https');
const zlib = require('zlib');
const cheerio = require('cheerio');

function get_product_price(id) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'www.kanbkam.com',
            path: `/eg/ar/toshiba-r03kgb-sp2tgc-heavy-duty-aaa-carbon-zinc-batteries-15-v-2-pieces-${id}`,
            method: 'GET',
            headers: {
                'Cookie': `search=%5B1724915056%2Cnull%5D; productViewed=%5B1724915056%2C%22${id}%22%2C%22B0CPD6XTK6%22%5D; XSRF-TOKEN=eyJpdiI6ImVWUDhmMkRjUEdGK3JJb0ZSTlROWnc9PSIsInZhbHVlIjoibGFDU2V6VzJtTjVGTG9oM2FPaDZ6OWJDQ2FzK2ZwVkdSNTFwOWNkOTlBK1ZHOUhZTTZKVWp6dFRZNHU3dnRsaURyRHhvK3hxcFE2cHFYNGw5T2phZnc9PSIsIm1hYyI6IjgxYzI5OTFmNTUxMzE3Nzc2ZTMzNjBmOWQ0ZDk1YzBkMDMyZGY0Y2VkNmRiY2EyNGFlY2QwMzNhYTJmM2RmMTUifQ%3D%3D; laravel_session=eyJpdiI6IlwvblpSYW13bmZRYTE5MTN2bHk2aHdRPT0iLCJ2YWx1ZSI6IlwvZTU1NHUyYitobnhvZENCbDl4SkFyeXAyTjQ5VU9BR3hvVXpMVzdKXC9uT0lQNFJvdUxjekJ3XC9zVlBcL29BRm45THlxWkFHYUt0YXRcL1QxQmFZZFgyN0E9PSIsIm1hYyI6ImRmNTUxYjQyOTIwMWEzOTc0MjZiYWUyZjkwNzQ4MjQ2NmM5N2MyYmQzMDRiMmY2MDdmMjk1Mjg0NmVmNDhhOGIifQ%3D%3D; NB_SRVID=srv476955`,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:129.0) Gecko/20100101 Firefox/129.0',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/png,image/svg+xml,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br',
                'Referer': 'https://www.kanbkam.com/eg/ar/exon-x1130-usb-30-male-adapter-usba-to-usb-31-female-adapter-typec-mulit-color-B0CPD6XTK6',
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
            const isHidden = available.attr('style') && available.attr('style').includes('display: none');
            // console.log(isHidden === false)
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

 async function get_product_by_asin (id){
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

