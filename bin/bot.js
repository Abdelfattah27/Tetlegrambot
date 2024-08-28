const amazonScraper = require('../lib/index');
// const amazonScraper = require('amazon-buddy');

(async () =>{
    const products = await amazonScraper.products({ keyword: 'Xbox One', number: 50 });

    console.log(products)


})() ;