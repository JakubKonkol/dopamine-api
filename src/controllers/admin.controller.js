const {getAll, getUserById} = require("../db/users.db");
const getAllUsers = async (req, res) => {
    return new Promise(async (resolve, reject) => {
        const users = await getAll();
        if(!users) return reject(res.status(400).json({error: 'No users found'}));
        return resolve(res.status(200).json(users));
    }).then((response) => {
        return response;
    }).catch((error) => {
        return error;
    })
}
const makeUserAdmin = async (req, res) => {
    try{
        const userId = req.params.userId;
        const user = await getUserById(userId);
        const existingUser = await getUserById(userId).select('+isAdmin');
        if(!existingUser) return res.status(400).json({error: 'User does not exist'});
        return new Promise(async (resolve, reject) => {
            if(!user) return reject(res.status(400).json({error: 'No user found'}));
            user.isAdmin = true;
            await user.save();
            return resolve(res.status(200).json({message: 'User is now admin'}));
        }).then((response) => {
            return response;
        }).catch((error) => {
            return error;
        })
    }catch (err){
        return res.status(500).json({error: 'Internal server error, make sure that you are providing a valid user id'});
    }

}
const removeAdmin = async (req, res) => {
    try{
        const userId = req.params.userId;
        const user = await getUserById(userId);
        const existingUser = await getUserById(userId).select('+isAdmin');
        if(!existingUser) return res.status(400).json({error: 'User does not exist'});
        return new Promise(async (resolve, reject) => {
            if(!user) return reject(res.status(400).json({error: 'No user found'}));
            user.isAdmin = false;
            await user.save();
            return resolve(res.status(200).json({message: 'User is not admin anymore'}));
        }).then((response) => {
            return response;
        }).catch((error) => {
            return error;
        })
    }catch (err){
        return res.status(500).json({error: 'Internal server error, make sure that you are providing a valid user id'});
    }

}
module.exports = {
    getAllUsers,
    makeUserAdmin,
    removeAdmin
}