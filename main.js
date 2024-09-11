
const amazonScraper = require('./lib/index');


 async function getProducts (keyword , category = "")  {
    console.log(keyword , category)
    const products = await amazonScraper.products({
        keyword: keyword || "شاشه",
        number: 75,
        country: 'EG' ,
        category : category ,
        randomUa : true
    });
    // const products= await amazonScraper.asin({
    //     asin : keyword ,
    //     country : "EG"  ,
    //     randomUa : true
    // });

    const result = await Promise.all(products.result.slice(0, 10).map(async (product) => {

        return product.url
    }));

    return result
};
getProducts("B0BWWP9CXK" , "electronics")
