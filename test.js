const AWS = require('aws-sdk');
const XLSX = require('xlsx');
const request = require('request');
AWS.config.loadFromPath('./config.json');

const workbook = { SheetNames: [], Sheets: {} };

const s3 = new AWS.S3();

const params = {
  Bucket: 's3-resizing-on-the-fly',
  // Delimiter: '/',
  // Marker: '',
  Prefix: 'allFunds/00646000004SNvqAAG/'
};

let extCount = 0;
let intCount = 0;

s3.listObjects(params, (err, resp) => {
  if (err) console.log('ERR', err);
  console.log(resp);
  resp.Contents.forEach(photo => {
    if (photo.Key.indexOf('exterior') !== -1) {
      extCount += 1;
    } else {
      intCount += 1;
    }
  })
  console.log('ext', extCount, 'int', intCount / 2)
})

const getAssetsRequest = () => new Promise((resolve, reject) => {
  const reqParams = {
    headers: {
      API_CLIENT: process.env.ASSETS_CLIENT_KEY,
      API_SECRET: process.env.ASSETS_SECRET_KEY,
    },
    url: `https://p5ak3v7pb9.execute-api.us-west-2.amazonaws.com/Production/assets?funds=3`,
  };
  request(reqParams, (err, response, body) => {
    if (err) {
      return reject(err);
    }
    if (!response) {
      return reject('No response from API');
    }
    if (response.statusCode === 403) {
      return reject('Unauthorized Request');
    }
    resolve(JSON.parse(body));
  });
});

const toWorkbook = async () => {
  try {
    const assets = await getAssetsRequest();
    console.log(assets.length);
    const worksheet = XLSX.utils.json_to_sheet(assets);
    workbook.SheetNames.push('test');
    workbook.Sheets['test'] = worksheet;
    console.log(workbook);
    XLSX.writeFile(workbook, 'out.xlsb');

  } catch (err) {
    console.log(err);
  }
}

toWorkbook();
