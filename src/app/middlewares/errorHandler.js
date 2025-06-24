// src/middlewares/errorHandler.js
import MailLog from '../../Mails/MailLog.js'

const errorHandler = (err, req, res, next) => {
    // Verifica se a transação foi passada no objeto req (se você decidir fazer isso)
    // ou se o erro já possui um método rollback
    if (req.transaction) {
        req.transaction.rollback().catch((rollbackErr) => {
            console.error('Erro ao fazer rollback da transação:', rollbackErr)
        })
    } else if (err.transaction) {
        // Se o erro carregar a transação de alguma forma
        err.transaction.rollback().catch((rollbackErr) => {
            console.error(
                'Erro ao fazer rollback da transação (do erro):',
                rollbackErr
            )
        })
    }

    const className = req.route
        ? req.route.stack[0].handle.name || 'UnknownClass'
        : 'UnknownClass'
    const functionName = req.method
        ? req.method.toLowerCase()
        : 'unknownFunction' // ou você pode tentar inferir de outra forma

    // Exemplo mais robusto para className e functionName, se quiser ser mais preciso:
    // Você pode passar essas informações do controller para o req antes de chamar 'next(err)'
    // Ex: req.controllerName = 'AgentController'; req.actionName = 'update';
    // Ou, se você padronizou o nome da função do controller, pode tentar extrair:
    // const functionName = err.controllerFunctionName || 'unknownFunction'; // requires controller to set this
    // const className = err.controllerClassName || 'unknownClass'; // requires controller to set this

    MailLog({ className, functionName, req, err })

    // Se o erro já tiver um status, usa ele, senão, 500
    const statusCode = err.status || 500
    const errorMessage = 'An internal server error has occurred.'

    return res.status(statusCode).json({
        error: errorMessage,
    })
}

export default errorHandler
