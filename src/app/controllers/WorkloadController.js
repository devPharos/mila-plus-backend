import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog'
import databaseConfig from '../../config/database'
import Workload from '../models/Workload'
import Level from '../models/Level'
import Languagemode from '../models/Languagemode'
import Programcategory from '../models/Programcategory'
import Paceguide from '../models/Paceguide'
import File from '../models/File'
import { app } from '../../config/firebase'
import { deleteObject, getStorage, ref } from 'firebase/storage'
import {
    generateSearchByFields,
    generateSearchOrder,
    verifyFieldInModel,
    verifyFilialSearch,
} from '../functions'

const { Op } = Sequelize

class WorkloadController {
    async show(req, res) {
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
            const className = 'WorkloadController'
            const functionName = 'show'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async index(req, res) {
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
            const className = 'WorkloadController'
            const functionName = 'index'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async store(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction()
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
                        transaction: t,
                    }

                delete req.body.file_id
            }

            const newWorkload = await Workload.create(
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
                    transaction: t,
                }
            ).then((workload) => {
                if (myFile) {
                    myFile
                        .update(
                            {
                                registry_uuidkey: workload.id,
                            },
                            {
                                transaction: t,
                            }
                        )
                        .then(() => {
                            t.commit()
                        })
                } else {
                    t.commit()
                }
            })

            return res.json(newWorkload)
        } catch (err) {
            await t.rollback()
            const className = 'WorkloadController'
            const functionName = 'store'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async update(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction()
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
                        transaction: t,
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
                    transaction: t,
                }
            )

            if (
                days_per_week ||
                hours_per_day ||
                (paceGuides && paceGuides.length > 0)
            ) {
                Paceguide.findAll({
                    where: {
                        workload_id,
                        canceled_at: null,
                    },
                }).then((paces) => {
                    // Criar versão nova
                    paces.forEach((pace) => {
                        Paceguide.update(
                            {
                                canceled_at: new Date(),
                                canceled_by: req.userId,
                            },
                            {
                                where: {
                                    company_id: 1,
                                    id: pace.dataValues.id,
                                },
                            }
                        )
                    })
                })
            }

            if (!days_per_week && !hours_per_day && paceGuides.length > 0) {
                paceGuides.map((paces) => {
                    if (paces.data && paces.data.length > 0) {
                        paces.data.map((pace) => {
                            if (pace.type && pace.description && paces.day) {
                                Paceguide.create({
                                    company_id: 1,
                                    workload_id,
                                    day: paces.day,
                                    ...pace,
                                    created_by: req.userId,
                                })
                            }
                        })
                    }
                })
            }

            t.commit()

            return res.json(workload)
        } catch (err) {
            await t.rollback()
            const className = 'WorkloadController'
            const functionName = 'update'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }
}

export default new WorkloadController()
