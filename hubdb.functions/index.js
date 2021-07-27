// POST https://crypto-keeper.io/_hcms/api/hubdb

const axios = require("axios");

exports.main = ({ body }, sendResponse) => {
  const hapikey = process.env.hapikey;
  let now = Date.now();

  try {
    const publish = async () => {
      now = Date.now();
      return await axios({
        method: "POST",
        url: "https://api.hubapi.com/cms/v3/hubdb/tables/crypto/draft/push-live",
        params: {
          hapikey,
        },
        headers: { "content-type": "application/json" },
      })
        .then(() => {
          console.log(`Published in ${(Date.now() - now) / 1000}s`);
        })
        .catch((e) => {
          console.log(e.message);
        });
    };

    date = Date.now();
    axios
      .get("https://api.hubapi.com/cms/v3/hubdb/tables/crypto/rows", {
        params: {
          properties: "symbol",
          hapikey,
          limit: 10000,
        },
      })
      .then((response) => {
        console.log(`Fetched Row Ids in ${(Date.now() - now) / 1000}s`);
        const idSymbolMap = response.data.results.map((r) => ({
          id: r.id,
          symbol: r.values.symbol,
        }));
        const ids = idSymbolMap.map((d) => d.id);
        date = Date.now();
        axios({
          method: "POST",
          url: "https://api.hubapi.com/cms/v3/hubdb/tables/crypto/rows/batch/read",
          params: {
            hapikey,
          },
          headers: { "content-type": "application/json" },
          data: { inputs: ids },
        })
          .then((res) => {
            console.log(`Fetched Row Data in ${(Date.now() - now) / 1000}s`);
            const results = res.data.results;
            let updates = [];
            let creates = [];
            console.log(`Found ${results.length} results`);
            body.forEach((i) => {
              const match = results.find((r) => r.values.symbol === i.symbol);
              if (match) {
                updates.push({
                  id: match.id,
                  values: i,
                });
              } else if (i) {
                creates.push({
                  values: i,
                });
              }
            });

            now = Date.now();
            if (updates.length) {
              console.log(`Updates - ${updates.length}`);
              axios({
                method: "POST",
                url: "https://api.hubapi.com/cms/v3/hubdb/tables/crypto/rows/draft/batch/update",
                params: {
                  hapikey,
                },
                headers: { "content-type": "application/json" },
                data: { inputs: updates },
              })
                .then(() => {
                  console.log(`Updated in ${(Date.now() - now) / 1000}s`);
                  publish();
                })
                .catch((e) => {
                  console.log(e.message);
                });
            }

            now = Date.now();
            if (creates.length) {
              console.log(`Creates - ${creates.length}`);
              axios({
                method: "POST",
                url: "https://api.hubapi.com/cms/v3/hubdb/tables/crypto/rows/draft/batch/create",
                params: {
                  hapikey,
                },
                headers: { "content-type": "application/json" },
                data: { inputs: creates },
              })
                .then((e) => {
                  console.log(`Created in ${(Date.now() - now) / 1000}s`);
                  publish();
                })
                .catch((e) => {
                  console.log(e.message);
                });
            }
          })
          .catch((e) => {
            console.log(e.message);
          });
      })
      .catch((e) => console.log(e.message));

    sendResponse({ statusCode: 200 });
  } catch (e) {
    sendResponse({ statusCode: 500 });
    console.log(e);
  }
};
