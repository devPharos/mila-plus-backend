import { emergepaySdk } from 'emergepay-sdk'

const oid = process.env.EMERGEPAY_OID
const authToken = process.env.EMERGEPAY_AUTH_TOKEN
const environmentUrl = process.env.EMERGEPAY_ENVIRONMENT_URL

export const emergepay = new emergepaySdk({
    oid: oid,
    authToken: authToken,
    environmentUrl: environmentUrl,
})
