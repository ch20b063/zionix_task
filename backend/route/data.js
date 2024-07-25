import express from 'express';
import axios from 'axios';
import axiosRetry from 'axios-retry';

axiosRetry(axios, { retries: 3, retryDelay: axiosRetry.exponentialDelay });

const router = express.Router();
const apiKeys = {
    mouser: '82675baf-9a58-4d5a-af3f-e3bbcf486560',
    rutronik: 'cc6qyfg2yfis',
    element14: 'wb9wt295qf3g6m842896hh2u'
};
const convertCurrency = (price, currency) => {
    if (currency === 'USD') return price * 84;
    if (currency === 'EUR') return price * 90;
    return price;
};


router.post('/search', async (req, res) => {
    const { partNumber, volume } = req.body;

    try {
        const [mouserRes, rutronikRes, element14Res] = await Promise.all([
            axios.post(`https://api.mouser.com/api/v1/search/partnumber?apiKey=${apiKeys.mouser}`, {
                SearchByPartRequest: {
                    mouserPartNumber: partNumber
                }
            }),
            axios.get(`https://www.rutronik24.com/api/search/?apikey=${apiKeys.rutronik}&searchterm=${partNumber}`),
            axios.get(`http://api.element14.com//catalog/products?term=manuPartNum:${partNumber}&storeInfo.id=in.element14.com&resultsSettings.offset=0&resultsSettings.numberOfResults=1&resultsSettings.refinements.filters=inStock&resultsSettings.responseGroup=medium&callInfo.omitXmlSchema=false&callInfo.callback=&callInfo.responseDataFormat=json&callinfo.apiKey=${apiKeys.element14}`)
        ]);



        const volumeRequired = volume;
        const results = [];
        const mouserItem = {
            partNumber,
            manufacturer: mouserRes.data.Manufacturer,
            dataProvider: 'Mouser',
            volume,
            unitPrice: mouserRes.data.Price ?
                (convertCurrency(mouserRes.data.Price, mouserRes.data.Currency)) :
                "0.00",
            totalPrice: mouserRes.data.Price ?
                (convertCurrency(mouserRes.data.Price, mouserRes.data.Currency) * volume) :
                "0.00"
        };

        results.push(mouserItem);

        const rutronikData = rutronikRes.data[0]
        let unitPriceEUR = rutronikData.price;
        for (const breakInfo of rutronikData.pricebreaks) {
            if (volumeRequired >= breakInfo.quantity) {
                unitPriceEUR = breakInfo.price;
            } 
        }

        const rutronikItem = {
            partNumber,
            manufacturer: rutronikData.manufacturer,
            dataProvider: 'Rutronik',
            volume,
            unitPrice: (convertCurrency(unitPriceEUR, 'EUR')).toFixed(6),
            totalPrice: (convertCurrency(unitPriceEUR, 'EUR') * volume).toFixed(2)
        };

        results.push(rutronikItem);
        const element14Data = element14Res.data.manufacturerPartNumberSearchReturn.products;
        for (const product of element14Data) {
            const { brandName, translatedManufacturerPartNumber, prices } = product;

            let unitPriceUSD = prices[0].cost;

            for (const priceBreak of prices) {
                if (volumeRequired >= priceBreak.from && volumeRequired <= priceBreak.to) {
                    unitPriceUSD = priceBreak.cost;
                    break;
                }
            }

            const unitPriceConverted = convertCurrency(unitPriceUSD, 'USD');
            const totalPriceConverted = unitPriceConverted * volume;

            const element14Item = {
                partNumber: translatedManufacturerPartNumber,
                manufacturer: brandName,
                dataProvider: 'Element14',
                volume,
                unitPrice: unitPriceConverted.toFixed(4),
                totalPrice: totalPriceConverted.toFixed(2)
            };

            results.push(element14Item);
        };

        results.sort((a, b) => a.totalPrice - b.totalPrice);

        res.json(results);
    }
    catch (error) {
        console.error(error);
        res.status(500).send('Error fetching data');
    }
});
router.post('/get-unit-price', async (req, res) => {
    const { partNumber, volume, dataProvider } = req.body;

    try {
        const [mouserRes, rutronikRes, element14Res] = await Promise.all([
            axios.post(`https://api.mouser.com/api/v1/search/partnumber?apiKey=${apiKeys.mouser}`, {
                SearchByPartRequest: {
                    mouserPartNumber: partNumber
                }
            }),
            axios.get(`https://www.rutronik24.com/api/search/?apikey=${apiKeys.rutronik}&searchterm=${partNumber}`),
            axios.get(`http://api.element14.com/catalog/products?term=manuPartNum:${partNumber}&storeInfo.id=in.element14.com&resultsSettings.offset=0&resultsSettings.numberOfResults=1&resultsSettings.refinements.filters=inStock&resultsSettings.responseGroup=medium&callInfo.omitXmlSchema=false&callInfo.callback=&callInfo.responseDataFormat=json&callinfo.apiKey=${apiKeys.element14}`)
        ]);

        let unitPrice = null;

        if (mouserRes.data && mouserRes.data.Parts && mouserRes.data.Parts.length > 0 && dataProvider === 'Mouser') {
            const mouserData = mouserRes.data.Parts[0];
            const mouserPriceBreak = mouserData.PriceBreaks.find(pb => volume >= pb.Quantity);
            if (mouserPriceBreak) {
                unitPrice = convertCurrency(mouserPriceBreak.Price, mouserRes.data.Currency);
            }
        }

        if (rutronikRes.data && rutronikRes.data.length > 0 && dataProvider === 'Rutronik') {
            const rutronikData = rutronikRes.data[0];
            let unitPriceEUR = convertCurrency(rutronikData.price, 'EUR');
            for (const breakInfo of rutronikData.pricebreaks) {
                if (volume >= breakInfo.quantity) {
                    unitPriceEUR = breakInfo.price;
                } else {
                    break;
                }
            }
            unitPrice = convertCurrency(unitPriceEUR, 'EUR');
        }

        if (element14Res.data && element14Res.data.manufacturerPartNumberSearchReturn &&
            element14Res.data.manufacturerPartNumberSearchReturn.products &&
            element14Res.data.manufacturerPartNumberSearchReturn.products.length > 0 && dataProvider === 'Element14') {
            const element14Data = element14Res.data.manufacturerPartNumberSearchReturn.products[0];
            let unitPriceUSD = element14Data.prices[0].cost; // Default to the first price
            for (const priceBreak of element14Data.prices) {
                if (volume >= priceBreak.from && volume <= priceBreak.to) {
                    unitPriceUSD = priceBreak.cost;
                    break;
                }
            }
            unitPrice = convertCurrency(unitPriceUSD, 'USD');
        }

        if (unitPrice === null) {
            return res.status(404).json({ error: 'Price not found for the given volume' });
        }

        res.json({ unitPrice: unitPrice.toFixed(4), dataProvider });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching unit price');
    }
});

export default router;


