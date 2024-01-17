const UserModel = require('../model/user');

const getAllUsers = () => UserModel.find();
const getUserByEmail = (email) => UserModel.findOne({email})
const getUserByToken = (token) => UserModel.findOne({'authentication.sessionToken': token})
const getUserById = (id) => UserModel.findById(id)
const createUser = (user) => new UserModel(user).save().then((user)=> user.toObject());
const updateUserById = (id, user) => UserModel.findByIdAndUpdate(id, user)
const deleteUserById = (id) => UserModel.findByIdAndDelete(id);

module.exports = {
    getAllUsers,
    getUserByEmail,
    getUserById,
    createUser,
    updateUserById,
    deleteUserById,
    getUserByToken
}