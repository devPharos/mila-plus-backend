import Sequelize from 'sequelize'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const { Op } = Sequelize

const filename = fileURLToPath(import.meta.url)
const directory = dirname(filename)

class PublicFileController {
    async show(req, res) {
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
    }
}

export default new PublicFileController()
