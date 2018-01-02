'use strict';

const request = require('request-promise')
const json2csv = require('json2csv')
const fs = require('fs')

let token = null
let ein = process.argv[2]
let today = new Date()
let day = 86400000 //number of milliseconds in a day
let yesterday = new Date(today - (3 * day))

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
    'dataPtCount',
    'datapt',
    'latitude',
    'longitude'
]

async function getByEIN(ein) {
    const options = {
        url: `https://packetsim-backend-production.splitsecnd.com/packetlogs?pageSize=25&pageNumber=1&startDate=${Date.parse(yesterday)}&endDate=${Date.parse(today)}&ein=${ein}`,
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

async function getLoginToken() {
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
                resolve(body.token);
            } catch (e) {
                reject(e);
            }
        });
    });
}

async function parsePacket(hex) {
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

function writeCSVtoFile(csv) {
    fs.writeFile(`${ein}_data.csv`, csv, function (err) {
        if (err) throw err;
        console.log(`${ein}_data.csv saved`);
    })
}

async function main() {
    console.log('Running...')
    console.log('Fetching data for: ' + ein)
    token = await getLoginToken()
    console.log('Logged in...')
    const einData = await getByEIN(ein)
    await Promise.all(einData.data.map(async (packet) => {
        const data = await parsePacket(packet.hex)
        parsedCache.push(data)
        if (data.dataPt !== undefined) {
            data.dataPt.map((pt) => {
                let newDataPt = {
                    latitude: (pt.deltaLatitude / 100000) + data.originLat,
                    longitude: (pt.deltaLongitude / 100000) + data.originLong
                }
                parsedCache.push(newDataPt)
            })
        }
    }))
    
    const csv = json2csv({ data: parsedCache, fields: fields })
    writeCSVtoFile(csv)
}

main()