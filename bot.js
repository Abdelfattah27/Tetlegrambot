

const TelegramBot = require('node-telegram-bot-api');


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


const token = '7440148973:AAGpsaMcbd1OYLIzh8yR8lwAAZzyMVkdqbg';
const bot = new TelegramBot(token, { polling: true });



let chatIds = [805411613 , 6312816792   ] //963705880 , 6312816792
const keywords = "ابجكلميى"
let index = 10

function getKeyword() {
    index  = ( index + 1) % keywords.length
    return keywords[index]
}

const fs = require('fs');
const path = './sentProducts.json'; // Path to the file that stores sent data

async function sendMessage() {
    try {
        const products = await getDiscountedProducts(getKeyword(), "electronics");
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
                let productInfo = `URL number ${index + 1}: ${product.url} - was ${product?.price?.before_price || "not sure"} be ${product?.price?.current_price || "not sure"}`;

                if(product.not_sure) {
                    productInfo += " Not Sure 😢"
                }
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

// Run every 30 minutes
// sendMessage()
setInterval(sendMessage,  2 * 60 * 1000);

// // Function to send a message to the user
// async function sendMessage() {
//     try {
//         const products = await getDiscountedProducts(getKeyword() , "electronics") 
//         let result = ""
//         if (products.length) {

//             products.forEach((product, index) => {
//                 result += `URL number ${index + 1}: ${product.url} - was ${product.prevPrice} be ${product.currentPrice}\n`;
//             });
//         }

//         for(let chatId of chatIds) {
//             if (result) {
//                 bot.sendMessage(chatId, result);
//             }else {
//                 bot.sendMessage(chatId, "no result");
                
//             }
//         }
// }catch (error) {
//     console.log("error happen" , error)
// }
// }


// setInterval(sendMessage,  0.5 * 60 * 1000);




bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    try{
    // console.log("Hello")
    console.log(chatId)
    let text = msg.text;
    let result = "";
    if (text.startsWith("/")) {
        console.log("It's a command");

        // Check if the command exists in the category map
        const category = text.replace("/" , "")

        if (category) {
            const productsURL = await getProducts(getKeyword(), category);
            // console.log(productsURL)

            productsURL.forEach((product, index) => {
                result += `URL number ${index + 1}: ${product}\n`;
            });

        } else {
            result = "Unknown command. Please use a valid category command.";
        }
    }

    if (text.includes("keyword")) {
        const keyword = text.replace("keyword" , "")

        const productsURL = await getProducts(keyword);
     

        productsURL.forEach((url, index) => {
            result += `url number ${index + 1}: ${url}\n`;
        });

        
    }
    if (!result) {
        result = "Please include keyword"
    }
    // Send a response
    bot.sendMessage(chatId, `${result}`);
}catch (error) {
    bot.sendMessage(chatId, `sorry, error happen try again `);
    console.log("Error happen" , error)
}
});


const axios = require('axios');
const amazonScraper = require('./lib/index');


 async function getProducts (keyword , category = "")  {
    console.log(keyword , category)
    const products = await amazonScraper.products({
        keyword: keyword || "شاشه",
        number: 75,
        country: 'EG' ,
        category : category
    });


    // console.log(products)
 
   
    // Use Promise.all to wait for all promises to resolve
    const result = await Promise.all(products.result.slice(0, 10).map(async (product) => {
        // const url = await createLink("test", product.url);

        return product.url
        // return {
        //     title: product.title,
        //     price: {
        //         ...product.price
        //     },
        //     url: url,
        //     bestSeller: product.bestSeller
        // };
    }));

    return result
};


let turn = true
function shuffleArray(array) {
    // Fisher-Yates (aka Knuth) Shuffle algorithm to randomize array
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

async function getDiscountedProducts (keyword , category = "")  {
    // console.log(keyword , category)

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
        products = products.slice(0 , 100)
    }

    // const productIds = products.map((p) => p.asin || p.id)
    // console.log(productIds)
    let discountedProducts = [];

    for (const product of products) {
        try {
            // console.log(product.item_available)
            var productId = product.asin || product.id;  
            
            // let productFromAmazon = await get_product_by_asin(productId)
            const current_price =  product?.price?.current_price || product?.price // productFromAmazon?.price?.current_price  ||
            const dbProduct = await getProductFromDB(productId);
            let beforePrice = dbProduct?.price || current_price
            if(current_price != beforePrice) {

                console.log(productId , beforePrice , current_price)
            }

            // if(!productFromAmazon.item_available) {
            //     continue
            // }
            if (dbProduct) {
                beforePrice = dbProduct.price 

                if(current_price &&  current_price < beforePrice * 0.7) {

                    const productFromAmazon = await get_product_by_asin(productId)
                    if (JSON.stringify(productFromAmazon) !== "{}"){

                       if((!productFromAmazon.item_available) && (!productFromAmazon.seller) ){
                            continue
                       }else {
                           discountedProducts.push(product); // productFromAmazon
                       }

                    }else {
                        product.not_sure = true 
                        discountedProducts.push(product); // productFromAmazon
                    }
                }else if (beforePrice < current_price) {
                    await updateProductPrice(productId , current_price)
                }
            } else {
                if(current_price){
                    addProductToDB(productId, current_price); 
                }

                const price_from_kanbkam =  await get_product_price(productId)
                if (price_from_kanbkam.rate ===3 ){
                    console.log("kanbkam object" , price_from_kanbkam)
                    price_from_kanbkam.not_sure = true
                    discountedProducts.push(price_from_kanbkam)
                }
                
            }
            // productFromAmazon.price.before_price = beforePrice
    }catch {
        console.log(`error in ${productId} ${turn}`)
    }

    }
    // turn = !turn




    //     // const productPrice = product.price.current_price;  
    //     // const price_from = await get_product_price(productId)


    //     if (!price_from.available) {
    //         continue
    //     }

    //     if (dbProduct) {
    //         const dbPrice = dbProduct.price;
    //         const price_web = price_from.previousPrice || dbPrice



    //         if (productPrice < price_web * 0.7) {
    //             product.currentPrice = productPrice
    //             product.prevPrice = price_web
    //             discountedProducts.push(product);
    //             // await updateProductPrice
    //         }

    //     } else {
    //         const price_web = price_from.previousPrice || productPrice

    //             if (productPrice < price_web * 0.7) {
    //                 product.currentPrice = productPrice
    //                 product.prevPrice = price_web
    //                 discountedProducts.push(product);
    //                 // await updateProductPrice
    //             }
                
    //         await addProductToDB(productId, price_from.previousPrice || productPrice);
    //     }
    // }

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
        db.run('update products set price = ? where id = ? ', [price, id], function(err) {
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


const categoryMap = {
    "/alldepartments": "aps",
    "/artscrafts": "electronics",
    "/automotive": "automotive-intl-ship",
    "/babyproducts": "baby-products-intl-ship",
    "/beauty": "beauty-intl-ship",
    "/books": "stripbooks-intl-ship",
    "/boysfashion": "fashion-boys-intl-ship",
    "/computers": "computers-intl-ship",
    "/deals": "deals-intl-ship",
    "/digitalmusic": "digital-music",
    "/electronics": "electronics-intl-ship",
    "/girlsfashion": "fashion-girls-intl-ship",
    "/healthhousehold": "hpc-intl-ship",
    "/homekitchen": "kitchen-intl-ship",
    "/industrialscientific": "industrial-intl-ship",
    "/kindlestore": "digital-text",
    "/luggage": "luggage-intl-ship",
    "/mensfashion": "fashion-mens-intl-ship",
    "/moviestv": "movies-tv-intl-ship",
    "/music": "music-intl-ship",
    "/petsupplies": "pets-intl-ship",
    "/primevideo": "instant-video",
    "/software": "software-intl-ship",
    "/sportsoutdoors": "sporting-intl-ship",
    "/toolshome": "tools-intl-ship",
    "/toysgames": "toys-and-games-intl-ship",
    "/videogames": "videogames-intl-ship",
    "/womensfashion": "fashion-womens-intl-ship",
};


async function createLink(text ,  url) {
    try {
        const response = await axios.post(
            'https://yajny.com/ar-eg/api/createLink',
            new URLSearchParams({
                offer_title: text,
                offer_link: url,
                _token: 'V6zNztmRZuQ9XoaFrKYqI69N3b8GUTg7DfyGLwzS',
            }).toString(),
            {
                headers: {
                    'Host': 'yajny.com',
                    'Cookie': 'XSRF-TOKEN=eyJpdiI6Ilh1TFRyc3dmbjdcL0VuVEJxQmhTTUJ3PT0iLCJ2YWx1ZSI6IlJXXC9DMzVpeVM1S0t0XC9pRjB3aENHZDhFM2MzRFhmeXB1RlgxQTdubVZacGc0NFozOTNtdnoraDRUdE03Vk9uSSIsIm1hYyI6ImJkMDlmYjQ5YTJhZWUyNDRkOGE1N2Q4ZGNjNGViNmE5MjhmZDEyMTA1NzNhN2MxNGIxNTEwYTNkZDhmMzRlYmEifQ%3D%3D; locale=eyJpdiI6InhmOUlZaGY4d1NORWFVY2tNZml1NUE9PSIsInZhbHVlIjoiTDVsK2ppNTlMSUFrYllcL2hMUlwvYmZRPT0iLCJtYWMiOiJlNWM0YWFkYWY0MGQ2MjViNmQ2NWU2ZjZlZjNhNGVjYjNhZDllNWRhMDkxMDEyNWFkZjI5Yjg0ZTVhMzk2MzdjIn0%3D; laravel_session=ssPPqUalCiUY7D2iMCqBxzX9Ryx9NkbxR4mQrr1w; _ga_3YCW3JSQEE=GS1.1.1723546535.1.1.1723547619.0.0.0; _ga=GA1.2.117238167.1723546536; _gcl_au=1.1.149298311.1723546536.1185091805.1723547328.1723547429; _ga_BGR3P50W12=GS1.1.1723546542.1.1.1723547619.35.0.0; _gid=GA1.2.1873281559.1723546543; _scid=7c7d5e91-bd38-410b-8670-582b26bd3882; _clck=14ycum7%7C2%7Cfoa%7C0%7C1686; _hjSessionUser_1469724=eyJpZCI6ImU3NzM2MmY1LWEyZWEtNTlmZi05NzAzLTZiYmI3MmJlMTYxNSIsImNyZWF0ZWQiOjE3MjM1NDY1NDQzNjcsImV4aXN0aW5nIjp0cnVlfQ==; _hjSession_1469724=eyJpZCI6ImE0ZDU2YTVlLWZlYjItNGNhOS1iMzFmLThmYjQ5N2MxMjc5MyIsImMiOjE3MjM1NDY1NDQzNjcsInMiOjAsInIiOjAsInNiIjowLCJzciI6MCwic2UiOjAsImZzIjoxLCJzcCI6MX0=; _tt_enable_cookie=1; _ttp=SxJmFLBdYBxEpC_ByhXDfDWqHoM; _sctr=1%7C1723496400000; _scid_r=7c7d5e91-bd38-410b-8670-582b26bd3882; _dc_gtm_UA-152044359-3=1',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:129.0) Gecko/20100101 Firefox/129.0',
                    'Accept': 'application/json, text/javascript, */*; q=0.01',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Origin': 'https://yajny.com',
                    'Referer': 'https://yajny.com/ar-eg/user/share-and-earn',
                    'Sec-Fetch-Dest': 'empty',
                    'Sec-Fetch-Mode': 'cors',
                    'Sec-Fetch-Site': 'same-origin',
                    'Priority': 'u=0',
                    'Te': 'trailers',
                    'Connection': 'close',
                }
            }
        );
        return response.data.data.linkInfo.shareLink
    } catch (error) {
        console.log(error)
        return url ;
    }
}

// (async()=>{
    
//     const products = await getDiscountedProducts("ه" , "electronics")
    
//     console.log("discounted ones" , products)

// })()