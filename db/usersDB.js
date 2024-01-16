const mongoose = require('mongoose');

const UserModel = require('../model/user');

const getAllUsers = async () => {UserModel.find()};
const getUserByEmail = async (email) => {UserModel.findOne({email})}
const getUserById = async (id) => {UserModel.findById(id)}
const createUser = async (user) => new UserModel(user).save().then((user)=> user.toObject());
const updateUser = async (id, user) => {UserModel.findByIdAndUpdate(id, user)};
const deleteUser = async (id) => {UserModel.findByIdAndDelete(id)};

module.exports = {
    getAllUsers,
    getUserByEmail,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
}