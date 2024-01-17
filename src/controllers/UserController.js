const {createUser, getUserByEmail} = require("../db/usersDB");
const {random, authentication} = require("../helpers/auth");
const register = async (req, res) => {
    const {email, username, password} = req.body;

    if (!email || !password || !username) {
        res.status(400).json({error: 'Missing required fields'});
        return;
    }
    const existUser = await getUserByEmail(email);
    if (existUser) {
        res.status(400).json({error: 'User already exists'});
        return;
    }
    const salt = random();
    createUser({
        email,
        username,
        authentication: {
            salt,
            password: authentication(salt, password)
        }
    }).then((user) => {
        res.status(200).json(user);
    }).catch((err) => {
        res.status(500).json({error: err});
    })
}
const login = async (req, res) => {
    const {email, password} = req.body;

    if (!email || !password) {
        return res.status(400).json({error: 'Missing required fields'});
    }
    const user = await getUserByEmail(email).select('+authentication.salt +authentication.password');

    if (!user) {
        return res.status(400).json({error: 'User does not exist'});
    }
    const expectedHash = authentication(user.authentication.salt, password);
    if (user.authentication.password !== expectedHash) {
        return res.status(400).json({error: 'Wrong password'});
    }
    const salt = random();
    user.authentication.sessionToken = authentication(salt, user._id.toString())
    await user.save();
    res.cookie('sessionToken', user.authentication.sessionToken, {domain: 'localhost', path: '/'})
    return res.status(200).json(user);
}
module.exports = {
    register,
    login,
}