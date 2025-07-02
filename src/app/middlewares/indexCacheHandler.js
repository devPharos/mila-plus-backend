// src/middlewares/indexCacheHandler.js

import { sequelizeCache } from '../../config/database.js'
import { isDefaultRequest } from '../functions/index.js'

const indexCacheHandler = async (req, res, next) => {
    let cacheKey = 'mila' + req.path + req.headers.filial
    cacheKey = cacheKey.split('/')
    cacheKey = cacheKey[0] + '/' + cacheKey[1]

    if (req.method !== 'GET') {
        console.log('remove cacheKey', cacheKey)
        if (sequelizeCache.has(cacheKey)) {
            sequelizeCache.del(cacheKey)
        }
        next()
        return
    }
    if (!req.url.includes('?')) {
        next()
        return
    }
    let defaultFilters = {
        search: '',
        limit: '50',
        type: 'null',
        page: '1',
    }
    let {
        orderBy = defaultFilters.orderBy,
        orderASC = defaultFilters.orderASC,
        search = defaultFilters.search,
        limit = defaultFilters.limit,
        type = defaultFilters.type,
        page = defaultFilters.page,
    } = req.query

    if (req.path === '/receivables') {
        defaultFilters = {
            search: '',
            limit: '50',
            type: 'pending',
            page: '1',
        }
    }

    let shouldCache = isDefaultRequest(defaultFilters, {
        orderBy,
        orderASC,
        search,
        limit,
        type,
        page,
    })

    if (req.path === '/receivables' || req.path === '/payees') {
        shouldCache = false
    }

    if (shouldCache) {
        const cachedData = sequelizeCache.get(cacheKey)
        if (cachedData) {
            return res.json(cachedData)
        }
        req.cacheKey = cacheKey
    }

    next() // Continua para o próximo middleware/controller
}

export function handleCache({ cacheKey, rows, count }) {
    const plainRows = rows.map((row) => row.toJSON())
    const responseData = { totalRows: count, rows: plainRows }
    sequelizeCache.set(cacheKey, responseData)
    // console.log('Data cached for key:', cacheKey)
}

export default indexCacheHandler
