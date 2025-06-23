// Simula o serviço de e-mail
const MailService = {
    send: async ({ user }) => {
        console.log(`Enviando e-mail para: ${user.email}`)
        // Simula um delay de rede
        await new Promise((resolve) => setTimeout(resolve, 2000))
        console.log(`E-mail enviado para ${user.email} com sucesso!`)
    },
}

module.exports = {
    key: 'RegistrationMail',
    async handle({ data }) {
        const { user } = data
        await MailService.send({ user })
    },
}
