import axios from 'axios'

export const parcelowAPI = axios.create({
    baseURL: process.env.PARCELOW_URL,
})
