const crypto = require('crypto');

const SECRET = 'DOPAMINE';

const authentication = (salt, password) => {
    return crypto.createHmac('sha256', [salt, password].join('/')).update(SECRET).digest('hex');
}

const random = () => {
    return crypto.randomBytes(128).toString('base64');
}

module.exports = {
    authentication,
    random
}