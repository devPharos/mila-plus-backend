import Sequelize from 'sequelize'
import { resolve } from 'path'

const { Op } = Sequelize
class PublicFileController {
    async show(req, res) {
        const { name } = req.params
        const path = `${resolve(
            __dirname,
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
