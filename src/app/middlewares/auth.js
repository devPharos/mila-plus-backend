import jwt from 'jsonwebtoken'
import { promisify } from 'util'

import authConfig from '../../config/auth'

export default async (req, res, next) => {
    const authHeader = req.headers.authorization
    const { origin } = req.headers

    if (
        origin !== process.env.FRONTEND_URL &&
        origin !== process.env.PHAROS_URL &&
        origin !== 'http://localhost:3000'
    ) {
        return next()
    }

    if (!authHeader) {
        return res.status(401).json({ error: 'Token not authorized!' })
    }

    const [, token] = authHeader.split(' ')

    try {
        const decoded = await promisify(jwt.verify)(token, authConfig.secret)

        req.companyId = decoded.company_id
        req.userId = decoded.id
        req.groupName = decoded.groupName
        return next()
    } catch (err) {
        return res.status(401).json({ error: 'Token invalid! ' })
    }
}
