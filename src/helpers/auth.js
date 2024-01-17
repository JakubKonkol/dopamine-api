const crypto = require('crypto');
const {getUserByToken} = require("../db/usersDB");
const {merge, get} = require("lodash");

const SECRET = 'DOPAMINE';

const authentication = (salt, password) => {
    return crypto.createHmac('sha256', [salt, password].join('/')).update(SECRET).digest('hex');
}

const random = () => {
    return crypto.randomBytes(128).toString('base64');
}
const isAuthenticated = async (req, res, next) => {
    try{
        const token = req.cookies['sessionToken'];
        if (!token) {
            return res.status(401).json({error: 'Unauthorized'});
        }
        const user = await getUserByToken(token);
        if (!user) {
            return res.status(401).json({error: 'Unauthorized'});
        }
        merge(req, {identity: user})
        return next();
    } catch (err) {
        return res.status(401).json({error: 'Unauthorized'});
    }
}
const isOwner = (req, res, next) => {
    try{
        const id = req.identity._id;
        const currentUserId = get(req, 'identity._id');
        if(!currentUserId){
            console.log('no current user id')
            return res.status(401).json({error: 'Unauthorized'});
        }
        if(currentUserId.toString() !== id){
            console.log('not owner')
            return res.status(401).json({error: 'Unauthorized'});
        }
        next();
    }catch (err) {
        console.log(err);
        return res.status(401).json({error: 'Unauthorized'});
    }
}

module.exports = {
    authentication,
    random,
    isAuthenticated,
    isOwner,
}