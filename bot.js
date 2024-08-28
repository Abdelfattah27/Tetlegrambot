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


let chatId = 805411613

// Function to send a message to the user
async function sendMessage() {
    const products = await getDiscountedProducts("ا" , "electronics") 
    let result = ""
    if (products.length) {
        products.forEach((product, index) => {
            result += `URL number ${index + 1}: ${product.url}\n`;
        });
    }

    if (result) {

        bot.sendMessage(chatId, result);
    }
}

// Schedule the message to be sent every 10 minutes (600,000 milliseconds)
setInterval(sendMessage, 10 * 60 * 1000);




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


bot.on('message', async (msg) => {
    console.log("Hello")
    const chatId = msg.chat.id;
    // console.log(chatId)
    let text = msg.text;
    let result = "";
    if (text.startsWith("/")) {
        console.log("It's a command");

        // Check if the command exists in the category map
        const category = text.replace("/" , "")

        if (category) {
            const productsURL = await getProducts("ا" , category);
            console.log(productsURL)

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
});


const axios = require('axios');
const amazonScraper = require('./lib/index');


 async function getProducts (keyword , category = "")  {
    console.log(keyword , category)
    const products = await amazonScraper.products({
        keyword: keyword || "شاشه",
        // number: 100,
        country: 'EG' ,
        category : category
    });
    console.log(products)
 
   
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





async function getDiscountedProducts (keyword , category = "")  {
    console.log(keyword , category)
    const products = await amazonScraper.products({
        keyword: keyword || "شاشه",
        // number: 100,
        country: 'EG' ,
        category : category
    });
    console.log(products)
    let discountedProducts = [];

    for (const product of products.result) {
        const productId = product.asin;  // Assuming `asin` as the product id
        const productPrice = product.price.current_price;  // Assuming price comes as `current_price`

        const dbProduct = await getProductFromDB(productId);

        if (dbProduct) {
            const dbPrice = dbProduct.price;

            // If the price is less than 20% of the stored price, add to the discounted list
            if (productPrice < dbPrice * 0.8) {
                discountedProducts.push(product);
            }

        } else {
            // If the product is not in the database, add it
            await addProductToDB(productId, productPrice);
        }
    }

    return discountedProducts;
    // products.forEach((product) => {
        
    // })
    // // Use Promise.all to wait for all promises to resolve
    // const result = await Promise.all(products.result.slice(0, 10).map(async (product) => {
    //     // const url = await createLink("test", product.url);

    //     return product.url
    //     // return {
    //     //     title: product.title,
    //     //     price: {
    //     //         ...product.price
    //     //     },
    //     //     url: url,
    //     //     bestSeller: product.bestSeller
    //     // };
    // }));

    // return result
};

// Function to check if the product exists in the database
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

// Function to add a product to the database
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