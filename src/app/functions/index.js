

export function randomString(length, chars) {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}

export const BASEURL = process.env.NODE_ENV === 'production' ? 'https://milaplus.pharosit.com.br' : 'http://localhost:3000';
