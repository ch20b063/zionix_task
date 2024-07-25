import express from 'express';
import axios from 'axios';

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
            } else {
                break;
            }
        }

        const rutronikItem = {
            partNumber,
            manufacturer: rutronikData.manufacturer,
            dataProvider: 'Rutronik',
            volume,
            unitPrice: (convertCurrency(unitPriceEUR, 'EUR')).toFixed(4),
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

export default router;


