import Sequelize from 'sequelize'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const { Op } = Sequelize

const filename = fileURLToPath(import.meta.url)
const directory = dirname(filename)

class PublicFileController {
    async show(req, res, next) {
        try {
            const { name } = req.params
            const path = `${resolve(
                directory,
                '..',
                '..',
                '..',
                'public',
                'uploads'
            )}/${name}`
            return res.download(path)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }
}

export default new PublicFileController()
