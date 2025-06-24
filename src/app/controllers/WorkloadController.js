import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog.js'
import databaseConfig from '../../config/database.js'
import Workload from '../models/Workload.js'
import Level from '../models/Level.js'
import Languagemode from '../models/Languagemode.js'
import Programcategory from '../models/Programcategory.js'
import Paceguide from '../models/Paceguide.js'
import File from '../models/File.js'
import { app } from '../../config/firebase.js'
import { deleteObject, getStorage, ref } from 'firebase/storage'
import {
    generateSearchByFields,
    generateSearchOrder,
    verifyFieldInModel,
    verifyFilialSearch,
} from '../functions/index.js'

const { Op } = Sequelize

class WorkloadController {
    async show(req, res, next) {
        try {
            const { workload_id } = req.params

            const workloads = await Workload.findByPk(workload_id, {
                include: [
                    {
                        model: Level,
                        include: [
                            {
                                model: Programcategory,
                            },
                        ],
                    },
                    {
                        model: Languagemode,
                    },
                    {
                        model: File,
                    },
                ],
            })

            if (!workloads) {
                return res.status(400).json({
                    error: 'Workload not found',
                })
            }

            return res.json(workloads)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async index(req, res, next) {
        try {
            const defaultOrderBy = {
                column: 'Level,Programcategory,name;Level,name;name',
                asc: 'ASC',
            }
            let {
                orderBy = defaultOrderBy.column,
                orderASC = defaultOrderBy.asc,
                search = '',
                limit = 10,
                type = '',
                page = 1,
            } = req.query

            if (!verifyFieldInModel(orderBy, Workload)) {
                orderBy = defaultOrderBy.column
                orderASC = defaultOrderBy.asc
            }

            const filialSearch = verifyFilialSearch(Workload, req)

            const searchOrder = generateSearchOrder(orderBy, orderASC)

            const searchableFields = [
                {
                    field: 'name',
                    type: 'string',
                },
            ]

            let level_id = null
            let languagemode_id = null

            if (type !== 'null') {
                const typeSplitted = type.split(',')
                level_id = typeSplitted[0]
                languagemode_id = typeSplitted[1]
            }

            const typeSearch = []
            if (level_id && level_id != 'null') {
                typeSearch.push({
                    level_id: {
                        [Op.eq]: level_id,
                    },
                })
            }
            if (languagemode_id && languagemode_id !== 'null') {
                typeSearch.push({
                    languagemode_id: {
                        [Op.eq]: languagemode_id,
                    },
                })
            }

            const { count, rows } = await Workload.findAndCountAll({
                where: {
                    ...filialSearch,
                    ...(await generateSearchByFields(search, searchableFields)),
                    ...(typeSearch.length > 0
                        ? {
                              [Op.and]: typeSearch,
                          }
                        : {}),
                    canceled_at: null,
                    company_id: 1,
                },
                include: [
                    {
                        model: Level,
                        required: false,
                        where: {
                            canceled_at: null,
                        },
                        include: [
                            {
                                model: Programcategory,
                                required: false,
                                where: {
                                    canceled_at: null,
                                },
                            },
                        ],
                    },
                    {
                        model: Languagemode,
                        required: false,
                        where: {
                            canceled_at: null,
                        },
                    },
                ],
                distinct: true,
                limit,
                offset: page ? (page - 1) * limit : 0,
                order: searchOrder,
            })

            return res.json({ totalRows: count, rows })
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async store(req, res, next) {
        try {
            const workloadExist = await Workload.findOne({
                where: {
                    company_id: 1,
                    level_id: req.body.level_id,
                    languagemode_id: req.body.languagemode_id,
                    days_per_week: req.body.days_per_week,
                    hours_per_day: req.body.hours_per_day,
                    canceled_at: null,
                },
            })

            if (workloadExist) {
                return res.status(400).json({
                    error: 'Workload already exists.',
                })
            }
            const {
                days_per_week,
                hours_per_day,
                languagemode_id,
                level_id,
                file_id,
            } = req.body

            let myFile = null
            if (file_id) {
                ;(myFile = await File.create({
                    company_id: 1,
                    name: file_id.name,
                    size: file_id.size,
                    url: file_id.url,
                    registry_type: 'Workload',
                    created_by: req.userId,
                })),
                    {
                        transaction: req.transaction,
                    }

                delete req.body.file_id
            }

            const workload = await Workload.create(
                {
                    company_id: 1,
                    name: `${days_per_week.toString()} day(s) per week, ${hours_per_day.toString()} hour(s) per day.`,
                    days_per_week,
                    file_id: myFile ? myFile.id : null,
                    hours_per_day,
                    languagemode_id,
                    level_id,
                    created_by: req.userId,
                },
                {
                    transaction: req.transaction,
                }
            )
            if (myFile) {
                await myFile.update(
                    {
                        registry_uuidkey: workload.id,
                    },
                    {
                        transaction: req.transaction,
                    }
                )
            }
            await req.transaction.commit()

            return res.json(workload)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async update(req, res, next) {
        try {
            const { workload_id } = req.params
            const workloadExist = await Workload.findByPk(workload_id)

            if (!workloadExist) {
                return res.status(400).json({
                    error: 'Workload doesn`t exists.',
                })
            }

            const { days_per_week, hours_per_day, paceGuides, file_id } =
                req.body
            let myFile = null

            if (file_id) {
                workloadExist.file_id
                if (workloadExist.file_id) {
                    const fileExist = await File.findByPk(workloadExist.file_id)
                    if (fileExist) {
                        const storage = getStorage(app)
                        const fileRef = ref(
                            storage,
                            'Scope and Sequence/' + fileExist.dataValues.name
                        )

                        deleteObject(fileRef)
                            .then(() => {})
                            .catch((error) => {
                                console.log(error)
                            })
                    }
                }

                ;(myFile = await File.create({
                    company_id: 1,
                    name: file_id.name,
                    size: file_id.size || 0,
                    url: file_id.url,
                    registry_type: 'Workload',
                    registry_uuidkey: workloadExist.id,
                    created_by: req.userId,
                })),
                    {
                        transaction: req.transaction,
                    }

                delete req.body.file_id
            }

            const workload = await workloadExist.update(
                {
                    ...req.body,
                    file_id: myFile ? myFile.id : workloadExist.file_id,
                    updated_by: req.userId,
                },
                {
                    transaction: req.transaction,
                }
            )

            if (
                days_per_week ||
                hours_per_day ||
                (paceGuides && paceGuides.length > 0)
            ) {
                const paces = await Paceguide.findAll({
                    where: {
                        workload_id,
                        canceled_at: null,
                    },
                })
                for (let pace of paces) {
                    await pace.destroy({
                        transaction: req.transaction,
                    })
                }
            }

            if (!days_per_week && !hours_per_day && paceGuides.length > 0) {
                for (let paces of paceGuides) {
                    if (paces.data && paces.data.length > 0) {
                        for (let pace of paces.data) {
                            if (pace.type && pace.description && paces.day) {
                                await Paceguide.create({
                                    company_id: 1,
                                    workload_id,
                                    day: paces.day,
                                    ...pace,
                                    created_by: req.userId,
                                })
                            }
                        }
                    }
                }
            }

            await req.transaction.commit()

            return res.json(workload)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }
}

export default new WorkloadController()
