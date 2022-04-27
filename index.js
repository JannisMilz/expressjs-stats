const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const DeviceDetector = require("device-detector-js");
const deviceDetector = new DeviceDetector();

const ms = require('ms')

async function routesTracker(req, res, next) {
    const informations = deviceDetector.parse(req.headers['user-agent'])

    var data = {
        ip: null,
        browser: null,
        os: null,
        device: null,
        route: null,
        timestamp: +new Date()
    }

    try { data.ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress } catch (error) {}
    if(data.ip == '::1') data.ip = 'localhost'
    try { data.browser = informations.client.type } catch (error) {}
    try { data.os = informations.os.name } catch (error) {}
    try { data.device = informations.device.type } catch (error) {}
    try { data.route = req.path } catch (error) {}

    await prisma.requests.create({
        data: data,
    })

    next()
}

async function getStats(range = 'alltime') {
    var time_period = 0
    if(range != 'alltime') time_period = ms(range)
    console.log("time_period: ", time_period);
    if(!time_period) return 'Invalid range'

    var timestamp_gte = 0
    if(range != 'alltime') timestamp_gte = +new Date() - time_period

    const getData = await prisma.requests.findMany({
        where: {
            timestamp: { 
                gte: timestamp_gte
            },
        }
    })

    const ips = [...new Set(getData.map(data => data.ip))]
    const devices = [...new Set(getData.map(data => data.device))]
    const os = [...new Set(getData.map(data => data.os))]
    const browsers = [...new Set(getData.map(data => data.browser))]
    const routes = [...new Set(getData.map(data => data.route))]

    const categories = ['ip', 'device', 'os', 'browser', 'route']
    const values = [ips, devices, os, browsers, routes]

    var dataArray = {}

    const totalAmount = await prisma.requests.count({ where: { timestamp: { gte: timestamp_gte } } })

    dataArray['time_range'] = range
    dataArray['total_requests'] = totalAmount
    dataArray['unique_users'] = ips.length

    for (let index = 0; index < categories.length; index++) {
        var catgAmount = 0
        
        if(categories[index] === 'device') catgAmount = await prisma.requests.count({ where: { timestamp: { gte: timestamp_gte }, NOT: { device: null } } })
        if(categories[index] === 'os') catgAmount = await prisma.requests.count({ where: { timestamp: { gte: timestamp_gte }, NOT: { os: null } } })
        if(categories[index] === 'browser') catgAmount = await prisma.requests.count({ where: { timestamp: { gte: timestamp_gte }, NOT: { browser: null } } })
        if(categories[index] === 'route') catgAmount = await prisma.requests.count({ where: { timestamp: { gte: timestamp_gte } } })
        
        var categoryDataArray = []
        
        if(categories[index] !== 'ip') {
            for (let i = 0; i < values[index].length; i++) {
                const element = values[index][i]
    
                if(element) {
                    var amount = 0

                    if(categories[index] === 'device') amount = await prisma.requests.count({ where: { timestamp: { gte: timestamp_gte }, NOT: { device: null }, device: element } })
                    if(categories[index] === 'os') amount = await prisma.requests.count({ where: { timestamp: { gte: timestamp_gte }, NOT: { os: null }, os: element } })
                    if(categories[index] === 'browser') amount = await prisma.requests.count({ where: { timestamp: { gte: timestamp_gte }, NOT: { browser: null }, browser: element } })
                    if(categories[index] === 'route') amount = await prisma.requests.count({ where: { timestamp: { gte: timestamp_gte }, route: element } })
        
                    const percentage = (amount / catgAmount * 100).toFixed(2)
    
                    categoryDataArray.push({
                        name: element,
                        requests: amount,
                        percentage: percentage + '%'
                    })
                }
            }
    
            categoryDataArray.sort((a, b) => parseFloat(b.requests) - parseFloat(a.requests))
    
            dataArray[categories[index]] = categoryDataArray
        }
    }

    return dataArray
}

module.exports = { routesTracker, getStats }