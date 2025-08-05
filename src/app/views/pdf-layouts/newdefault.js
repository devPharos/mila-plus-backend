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
export function newheader({
    title1 = '',
    title2 = '',
    doc = null,
    maxWidth = 0,
    date = null,
    id = '',
}) {
    if (!doc) return
    doc.lineWidth(20)

    doc.font(myriadBold)
        .fontSize(22)
        .fillColor('#2a2773')
        .text(title1, 30, 20, {
            align: 'left',
        })

    doc.fontSize(32)
        .fillColor('#ee5827')
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

    doc.image(
        resolve(directory, '..', 'assets', 'mila-logo.png'),
        maxWidth - 100,
        20,
        {
            width: 70,
            align: 'right',
        }
    )

    doc.rect(0, 90, maxWidth, 16).fill('#2a2773')

    doc.font(myriadSemiBold)
        .fontSize(10)
        .fillColor('#fff')
        .text('CAMPUS:', 30, 94, {
            align: 'left',
        })

    doc.font(myriadSemiBold)
        .fontSize(10)
        .fillColor('#fff')
        .text('DATE:', 202, 94, {
            align: 'left',
        })
}

export function headerLogo(doc = null) {
    if (!doc) return
    doc.image(resolve(directory, '..', 'assets', 'mila-white.png'), 20, 20, {
        width: 70,
    })
}

export function headerLine({
    doc = null,
    maxWidth = 0,
    width = 200,
    topPos = 146,
    text = '',
}) {
    if (!doc) return
    doc.rect(20, topPos, width, 20).fill('#E85F00')
    doc.rect(
        width > 20 ? width : 20,
        topPos + 9,
        width > 20 ? maxWidth - width - 20 : maxWidth - 40,
        2
    ).fill('#E85F00')

    if (text !== '') {
        doc.fill('#fff')
            .fontSize(10)
            .text(`${text}`, 30, topPos + 6, {
                align: 'left',
            })
    }

    doc.lineWidth(1)
}

export function inputLine({
    doc = null,
    width = '1',
    topPos = 176,
    leftPos = '1',
    answer = '',
    text = '',
    height = 16,
    maxWidth = 0,
}) {
    if (!doc) return
    const inputMaxWidth = maxWidth - 60
    if (!answer) {
        answer = ''
    }
    if (width === '1') {
        width = inputMaxWidth
    } else if (width === '1/2') {
        width = inputMaxWidth * 0.5
    } else if (width === '1/4') {
        width = inputMaxWidth * 0.245
    } else if (width === '3/4') {
        width = inputMaxWidth * 0.755
    } else if (width === '1/6') {
        width = inputMaxWidth * 0.16667
    } else if (width === '1/8') {
        width = inputMaxWidth * 0.125
    } else if (width === '1/10') {
        width = inputMaxWidth * 0.1
    }

    if (leftPos === '1') {
        leftPos = 0
    } else if (leftPos === '2') {
        leftPos = inputMaxWidth * 0.255
    } else if (leftPos === '3') {
        leftPos = inputMaxWidth * 0.51
    } else if (leftPos === '4') {
        leftPos = inputMaxWidth * 0.765
    } else if (leftPos === '2/10') {
        leftPos = inputMaxWidth * 0.11
    }
    doc.fontSize(6)
        .fill('#777')
        .text(text, leftPos + 30, topPos, {
            width,
        })
    doc.lineJoin('round')
        .rect(leftPos + 30, topPos + 6, width, height)
        .strokeColor('#E85F00')
        .stroke()

    doc.fontSize(8)
        .fill('#111')
        .text(answer, leftPos + 35, topPos + 12, {
            width,
        })
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

export function footer({
    doc = null,
    maxWidth = 0,
    id = '',
    page = null,
    pages = null,
}) {
    if (!doc) return
    doc.rect(0, 762, maxWidth, 30).fill('#E85F00')

    doc.fill('#FFF')
        .fontSize(8)
        .text(id, 30, 780, {
            width: maxWidth - 60,
            align: 'center',
        })

    if (page && pages) {
        doc.fill('#FFF')
            .fontSize(8)
            .text(`Page ${page} / ${pages}`, 30, 780, {
                width: maxWidth - 60,
                align: 'right',
            })
    }
}
