const UserModel = require('../model/user');

const getAll = () => UserModel.find();
const getUserByEmail = (email) => UserModel.findOne({email})
const getUserByToken = (token) => UserModel.findOne({'authentication.sessionToken': token})
const getUserById = (id) => UserModel.findById(id)
const createUser = (user) => new UserModel(user).save().then((user)=> user.toObject());
const updateUserById = (id, user) => UserModel.findByIdAndUpdate(id, user)
const deleteUserById = (id) => UserModel.findByIdAndDelete(id);
const getUsersByWatchListCount = (watchListCount)  => UserModel.aggregate([
    { $match: { 'userDetails.watchList': { $size: watchListCount } } },
    { $group: { _id: null, count: { $sum: 1 } } },
]);
const getUsersWithMostPlaylists = () => UserModel.aggregate([
    { $project: { playlistCount: { $size: '$userDetails.playlists' } } },
    { $sort: { playlistCount: -1 } },
    { $limit: 5 },
]);
const getUsersWithWatchListCountGreaterThan = (count) => UserModel.aggregate([
    {
        $match: {
            $expr: { $gt: [{ $size: '$userDetails.watchList' }, count] }
        }
    }
]);
const getUsersWithPlaylistName = (playlistName) => UserModel.find({
    'userDetails.playlists.name': playlistName
});
const updatePlaylistNameForUser = (userId, playlistId, newName) => UserModel.updateOne(
    { _id: userId, 'userDetails.playlists._id': playlistId },
    { $set: { 'userDetails.playlists.$.name': newName } }
);

module.exports = {
    getAll,
    getUserByEmail,
    getUserById,
    createUser,
    updateUserById,
    deleteUserById,
    getUserByToken,
    getUsersByWatchListCount,
    getUsersWithMostPlaylists,
    getUsersWithWatchListCountGreaterThan,
    getUsersWithPlaylistName,
    updatePlaylistNameForUser
}