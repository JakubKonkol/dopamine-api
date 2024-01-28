const {createUser, getUserByEmail, deleteUserById, getUserById, updateUserById} = require("../db/users.db");
const {random, authentication} = require("../helpers/auth");
const {isEmailValid, isPasswordValid} = require("../helpers/validators");
const register = async (req, res) => {
    const {email, username, password} = req.body;

    if (!email || !password || !username) {
        res.status(400).json({error: 'Missing required fields'});
        return;
    }
    if(!isEmailValid(email)){
        res.status(400).json({error: 'Invalid email'});
        return;
    }
    if(!isPasswordValid(password)){
        res.status(400).json({error: 'Invalid password'});
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
    if(!isPasswordValid(password)){
        return res.status(400).json({error: 'Invalid password'});
    }
    if(!isEmailValid(email)){
        return res.status(400).json({error: 'Invalid email'});
    }
    const expectedHash = authentication(user.authentication.salt, password);
    if (user.authentication.password !== expectedHash) {
        return res.status(400).json({error: 'Wrong password'});
    }
    const salt = random();
    user.authentication.sessionToken = authentication(salt, user._id.toString())
    await user.save();
    res.cookie('sessionToken', user.authentication.sessionToken, {domain: 'localhost', path: '/'})
    return res.status(200).json({message: 'Logged in successfully'});
}
const logout = async (req, res) => {
    const {identity} = req;
    identity.authentication.sessionToken = null;
    await identity.save();
    res.clearCookie('sessionToken', {domain: 'localhost', path: '/'})
    return res.status(200).json({message: 'Logged out successfully'});
}
const getProfile = async (req, res) => {
    try{
        const identity = req.identity;
        const userDetails = await getUserByEmail(identity.email).select('-authentication.password -authentication.salt -authentication.sessionToken');
        return res.status(200).json(userDetails);
    }catch (err) {
        return res.status(401).json({error: 'Unauthorized'});
    }
}
const deleteUser = async (req, res) => {
    const id = req.params.userId;
    try{
        const userExist = await getUserById(id);
        if(!userExist){
            return res.status(400).json({error: 'User does not exist'});
        }
        const deletedUser = await deleteUserById(id);
        return res.status(200).json(deletedUser);
    }catch (err){
        console.log(err);
        return res.status(500).json({error: 'Internal server error'});
    }
}
const updateUsernameAndEmail = async (req, res) => {
    try{
        const identity = req.identity;
        const user = await getUserByEmail(identity.email);
        if(!user){
            return res.status(400).json({error: 'User does not exist'});
        }
        const {email, username} = req.body;
        if(!email || !username){
            return res.status(400).json({error: 'Missing required fields'});
        }
        user.email = email;
        user.username = username;
        await updateUserById(user._id, user);
        return res.status(200).json(user);
    }catch (err) {
        console.log(err);
        return res.status(500).json({error: 'Internal server error'});
    }
}
const createDefaultAdmin = async () =>{
    const username = 'dopamine'
    const email = 'dopamine@admin.com'
    const password = 'dopamine'
    const salt = random();
    const existUser = await getUserByEmail(email);
    if (existUser) {
        return;
    }
    createUser({
        email,
        username,
        isAdmin: true,
        authentication: {
            salt,
            password: authentication(salt, password)
        }
    }).catch((err) => {
        console.log(err);
    })

}
module.exports = {
    register,
    login,
    getProfile,
    logout,
    deleteUser,
    updateUsernameAndEmail,
    createDefaultAdmin
}