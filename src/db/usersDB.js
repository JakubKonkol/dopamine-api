const UserModel = require('../model/user');

const getAllUsers = () => UserModel.find();
const getUserByEmail = (email) => UserModel.findOne({email})
const getUserById = (id) => UserModel.findById(id)
const createUser = (user) => new UserModel(user).save().then((user)=> user.toObject());
const updateUser = (id, user) => UserModel.findByIdAndUpdate(id, user)
const deleteUser = (id) => UserModel.findByIdAndDelete(id);

module.exports = {
    getAllUsers,
    getUserByEmail,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
}