'use strict';

const request = require('request-promise')

let token = null
const danilo = '208011402656696'
const matteo = '208011402656945'

let packetCache = []

function getByEIN(ein) {
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

function getLoginToken() {
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

function parsePacket(hex) {
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

function parsePacketsInCache() {
    packetCache.map(function(hex) {
        parsePacket(hex)
        .then(function(parseData) {
            console.log(parseData)
        })
    })
}

getLoginToken()
    .then(function (data) {
    console.log('started')
        token = data.token
        Promise.all([
            getByEIN(matteo),
            getByEIN(danilo),
          ])
            .then(function ([matteoData, daniloData]) {
                daniloData.data.map(function(packet) {
                    packetCache.push(packet.hex)
                })
                matteoData.data.map(function(packet) {
                    packetCache.push(packet.hex)
                })
                parsePacketsInCache()
            })
    })
    .catch(function (err) {
        // POST failed...
});

