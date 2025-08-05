import { format } from 'date-fns'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
const filename = fileURLToPath(import.meta.url)
const directory = dirname(filename)

const myriadCond = resolve(
    directory,
    '..',
    'assets',
    'fonts',
    'myriad-pro',
    'MYRIADPRO-COND.OTF'
)
const myriadSemiBold = resolve(
    directory,
    '..',
    'assets',
    'fonts',
    'myriad-pro',
    'MYRIADPRO-SEMIBOLD.OTF'
)
const myriadBold = resolve(
    directory,
    '..',
    'assets',
    'fonts',
    'myriad-pro',
    'MYRIADPRO-BOLD.OTF'
)
const myriad = resolve(
    directory,
    '..',
    'assets',
    'fonts',
    'myriad-pro',
    'MYRIADPRO-REGULAR.OTF'
)
const orange = '#ee5827'
const blue = '#2a2773'
export function newheader({
    title1 = '',
    title2 = '',
    doc = null,
    maxWidth = 0,
    filial = null,
}) {
    if (!doc) return
    doc.lineWidth(20)

    doc.font(myriadBold).fontSize(22).fillColor(blue).text(title1, 30, 20, {
        align: 'left',
    })

    doc.fontSize(32)
        .fillColor(orange)
        .font(
            resolve(
                directory,
                '..',
                'assets',
                'fonts',
                'Stackyard_PERSONAL_USE.ttf'
            )
        )
        .text(title2, 60, 46, {
            align: 'center',
        })
        .font(myriadBold)

    doc.image(resolve(directory, '..', 'assets', 'lines.png'), 0, 50, {
        width: 230,
        align: 'right',
    })

    doc.image(
        resolve(directory, '..', 'assets', 'mila-logo.png'),
        maxWidth - 100,
        20,
        {
            width: 70,
            align: 'right',
        }
    )

    doc.rect(0, 90, maxWidth, 16).fill(blue)

    doc.font(myriadSemiBold)
        .fontSize(10)
        .fillColor('#fff')
        .text('CAMPUS:  ' + filial.name, 30, 94, {
            align: 'left',
        })

    doc.font(myriadSemiBold)
        .fontSize(10)
        .fillColor('#fff')
        .text('DATE:  ' + format(new Date(), 'MM/dd/yyyy'), 202, 94, {
            align: 'left',
        })
}

export function headerLogo(doc = null) {
    if (!doc) return
    doc.image(resolve(directory, '..', 'assets', 'mila-white.png'), 20, 20, {
        width: 70,
    })
}

export function newheaderLine({
    doc = null,
    maxWidth = 0,
    width = 200,
    topPos = 146,
    text = '',
    line = 1,
}) {
    if (!doc) return
    doc.rect(20, topPos, width, 30).fill(orange)
    doc.rect(line === 1 ? 0 : 20, topPos + 14, maxWidth, 3).fill(orange)

    if (text !== '') {
        doc.fill('#fff')
            .fontSize(16)
            .text(`${text}`, 30, topPos + 9, {
                align: 'left',
            })
    }

    doc.lineWidth(1)
}

export function newinputLine({
    doc = null,
    width = 0,
    topPos = 176,
    leftPos = 0,
    answer = '',
    text = '',
    height = 30,
    image = null,
    subLabel = '',
}) {
    const maxWidth = 590
    if (!doc) return
    if (!answer) {
        answer = ''
    }

    if (leftPos + width > maxWidth - 20) {
        width = maxWidth - 20 - leftPos
    }

    doc.lineJoin('round')
        .rect(leftPos + 20, topPos, width, height)
        .dash(1, { space: 1 })
        .stroke(blue)
        .undash()

    doc.fillColor('#555')
        .fontSize(6)
        .text(text, leftPos + 20, topPos + 22, {
            width,
            align: 'center',
        })

    if (image && answer !== '') {
        doc.image(image, leftPos + 20 + (width - 16) / 2, topPos + 7, {
            width: 14,
        })
    } else {
        doc.fontSize(10)
            .fill('#111')
            .text(answer, leftPos + 20, topPos + 9, {
                width,
                align: 'center',
            })
    }

    if (subLabel) {
        doc.fontSize(6)
            .fill('#555')
            .text(subLabel, leftPos + 20, topPos + 32, {
                width,
                align: 'center',
            })
    }
}

export function faixa({ doc = null, maxWidth = 0, topPos = 0, height = 6 }) {
    if (!doc) return
    doc.rect(0, topPos, maxWidth, height).fill('#EEECEC')
}

export function signatureLine({
    doc = null,
    width = '1',
    topPos = 176,
    leftPos = '1',
    text = '',
    height = 16,
    maxWidth = 0,
}) {
    if (!doc) return
    const inputMaxWidth = maxWidth - 60
    if (width === '1') {
        width = inputMaxWidth
    } else if (width === '1/2') {
        width = inputMaxWidth * 0.5
    } else if (width === '1/4') {
        width = inputMaxWidth * 0.245
    } else if (width === '3/4') {
        width = inputMaxWidth * 0.755
    }

    if (leftPos === '1') {
        leftPos = 0
    } else if (leftPos === '2') {
        leftPos = inputMaxWidth * 0.255
    } else if (leftPos === '3') {
        leftPos = inputMaxWidth * 0.51
    } else if (leftPos === '4') {
        leftPos = inputMaxWidth * 0.765
    }
    doc.lineJoin('round')
        .rect(leftPos + 30, topPos + height, width, 1)
        .strokeColor('#E85F00')
        .stroke()
    doc.fontSize(7)
        .fill('#111')
        .text(text, leftPos + 30, topPos + height + 8, {
            width,
            align: 'center',
        })
}

export function newfooter({
    doc = null,
    maxWidth = 0,
    page = null,
    pages = null,
}) {
    if (!doc) return

    doc.image(resolve(directory, '..', 'assets', 'line2.png'), 0, 755, {
        width: 505,
        align: 'right',
    })

    doc.font(myriad).fill(blue).fontSize(10).text('www.milausa.com', 510, 757, {
        width: 140,
        align: 'left',
    })

    if (page && pages) {
        doc.font(myriadSemiBold)
            .fill(blue)
            .fontSize(12)
            .text(`Page ${page}/${pages}`, 30, 770, {
                width: maxWidth - 55,
                align: 'right',
            })
    }
}
