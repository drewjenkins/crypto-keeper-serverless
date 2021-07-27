// GET https://crypto-keeper.io/_hcms/api/transform-prices

// prettier-ignore
const isSymbolTradeable = (symbol = "") => ["AAVE","ADA","ALGO","ANKR","ARDR","ARK","ATOM","AVAX","BAL","BAND","BAT","BCH","BLZ","BNB","BNT","BTC","CELR","CHR","CHZ","CKB","COMP","COS","CRO","CRV","DAI","DASH","DIA","DOGE","DOT","eGLD","ELF","ENJ","EOS","ETC","ETH","FET","FIL","FLOW","GAS","GLM","GRT","HOT","ICX","IRIS","KAVA","KMD","KNC","KSM","LINK","LRC","LSK","LTC","MANA","MATIC","MKR","NANO","NEAR","NEO","OCEAN","OGN","OMG","ONE","ONG","ONT","PAX","PAXG","QTUM","REN","RLC","RVN","SAND","SKL","SNX","SOL","STORJ","STRAX","STX","TAUD","TCAD","TFUEL","TGBP","THETA","TOMO","TUSD","UMA","UNI","USDC","USDM","USDT","VET","VTHOR","WAVES","WBTC","WTC","XLM","XRP","XSGD","XTZ","YFI","ZIL","ZRX"].includes((symbol || "").trim().toUpperCase());

const buildHistoricalData = (key, input) => {
  let _key;
  switch (key) {
    case "1h": {
      _key = "price_change_percentage_1h_in_currency";
      break;
    }
    case "1d": {
      _key = "price_change_percentage_24h_in_currency";
      break;
    }
    case "7d": {
      _key = "price_change_percentage_7d_in_currency";
      break;
    }
    case "30d": {
      _key = "price_change_percentage_30d_in_currency";
      break;
    }
    case "365d": {
      _key = "price_change_percentage_1y_in_currency";
      break;
    }
  }

  if (!_key) {
    return JSON.stringify({
      priceChange: 0,
      priceChangePercent: 0,
    });
  }

  return JSON.stringify({
    priceChange: input[_key] * 0.01 * (input.current_price || 0),
    priceChangePercent: input[_key] * 0.01,
  });
};

const parseSparkline = (sparkline = { price: [] }) => {
  const prices = sparkline.price;
  if (prices.length < 10) {
    return JSON.stringify(prices);
  }

  const parsed = prices.filter((value, index) => {
    return index % 3 == 0;
  });

  parsed.pop();
  parsed.push(prices[prices.length - 1]);

  return JSON.stringify(parsed);
};

exports.main = ({ body }, sendResponse) => {
  const transform = (input, index) => {
    const crypto = {};

    const symbol = input.symbol.toUpperCase();
    crypto.symbol = symbol;
    crypto.label = input.name;
    crypto.icon_url = input.image;
    crypto.market_cap = input.market_cap || 0;
    crypto.price = input.current_price || 0;
    crypto.rank = body.perPage * (body.page - 1) + (index + 1);
    crypto.market_cap_rank = input.market_cap_rank;
    crypto.sparkline = parseSparkline(input.sparkline_in_7d);
    crypto.tradeable = `${isSymbolTradeable(symbol)}`;

    crypto["history_1h"] = buildHistoricalData("1h", input);
    crypto["history_1d"] = buildHistoricalData("1d", input);
    crypto["history_7d"] = buildHistoricalData("7d", input);
    crypto["history_30d"] = buildHistoricalData("30d", input);
    crypto["history_365d"] = buildHistoricalData("365d", input);

    return crypto;
  };

  try {
    sendResponse({
      body: {
        data: ((body && body.prices) || []).map(transform),
      },
      statusCode: 200,
    });
  } catch (e) {
    console.log(e.message);
    sendResponse({ body: { data: [], error: e.message }, statusCode: 500 });
  }
};
