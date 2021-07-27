// GET https://crypto-keeper.io/_hcms/api/fetch-prices

const CoinGecko = require("coingecko-api");
const remove = require("lodash/remove");
const uniqBy = require("lodash/uniqBy");
const blacklist = ["ong-social"];

exports.main = async (context, sendResponse) => {
  const { page, perPage } = context.params;
  try {
    const CoinGeckoClient = new CoinGecko();
    const res = await CoinGeckoClient.coins.markets({
      price_change_percentage: "1h,24h,7d,30d,1y",
      sparkline: true,
      per_page: perPage || 100,
      page: parseInt(page[0]),
      vs_currency: "usd",
    });

    const data = res.data.sort((a, b) =>
      b.market_cap_rank && a.market_cap_rank
        ? a.market_cap_rank - b.market_cap_rank
        : a.market_cap_rank
        ? -1
        : 1
    );
    remove(data, (v) => blacklist.includes(v.name));

    console.log(`Fetched ${data.length} items`);
    sendResponse({ body: { data: uniqBy(data, "symbol") }, statusCode: 200 });
  } catch (e) {
    console.log(e);
    sendResponse({ body: { error: e.message }, statusCode: 500 });
  }
};
