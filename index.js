'use strict';

const request = require('request-promise')
const json2csv = require('json2csv')
const fs = require('fs')

let token = null
let ein = process.argv[2]

let parsedCache = []
const fields = [
    'powerInputVoltage',
    'internalBatteryVoltage',
    'heading',
    'altitud',
    'originLat',
    'originLong',
    'originHdop',
    'originNumOfSats',
    'ein',
    'originTimestamp',
    'datapt']

function getByEINRequest(ein) {
    const options = {
        url: 'https://packetsim-backend-production.splitsecnd.com/packetlogs?pageSize=25&pageNumber=1&startDate=1513200000000&endDate=1513317600000&ein=' + ein,
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Authorization': token
        },
        json: true
    };
    return new Promise(function (resolve, reject) {
        request(options, function (error, response, body) {
            // in addition to parsing the value, deal with possible errors
            if (error) return reject(error);
            try {
                // JSON.parse() can throw an exception if not valid JSON
                resolve(body);
            } catch (e) {
                reject(e);
            }
        });
    });
}

async function getByEIN(ein) {
    const data = await getByEINRequest(ein)
    return data
}

function getLoginTokenRequest() {
    const options = {
        method: 'POST',
        uri: 'https://packetsim-backend-production.splitsecnd.com/login',
        body: {
            email: 'casey@splitsecnd.com',
            password: 'Password1'
        },
        json: true // Automatically stringifies the body to JSON
    }
    return new Promise(function (resolve, reject) {
        request(options, function (error, response, body) {
            // in addition to parsing the value, deal with possible errors
            if (error) return reject(error);
            try {
                // JSON.parse() can throw an exception if not valid JSON
                resolve(body);
            } catch (e) {
                reject(e);
            }
        });
    });
}

async function getLoginToken() {
    const data = await getLoginTokenRequest()
    return data.token
}

function parsePacketRequest(hex) {
    const options = {
        url: 'https://packetsim-backend-production.splitsecnd.com/parsePacket',
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Authorization': token
        },
        body: {
            hex: hex
        },
        json: true
    };
    return new Promise(function (resolve, reject) {
        request(options, function (error, response, body) {
            // in addition to parsing the value, deal with possible errors
            if (error) return reject(error);
            try {
                // JSON.parse() can throw an exception if not valid JSON
                resolve(body);
            } catch (e) {
                reject(e);
            }
        });
    });
}

async function parsePacket(hex) {
    const data = await parsePacketRequest(hex)
    return data
}

// function writeParsedDataToCSV() {
//     console.log(parsedCache)
//     var csv = json2csv({ data: parsedCache });
//     fs.writeFile(`${ein}_packetData.csv`, csv, function(err) {
//         if (err) throw err;
//         console.log('file saved');
//     });
// }


async function main () {
    console.log('Running...')
    console.log('Fetching data for: ' + ein)
    token = await getLoginToken()
    console.log('Logged in...')
    const einData = await getByEIN(ein)
    await Promise.all(einData.data.map(async (packet) => {
        const data = await parsePacket(packet.hex)
        parsedCache.push(data)
    }))
    const csv = json2csv({ data: parsedCache, fields: fields })
    fs.writeFile('file.csv', csv, function(err) {
      if (err) throw err;
      console.log('file saved');
    })
}

main()