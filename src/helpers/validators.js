const isEmailValid = (email) => {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
}
const isPasswordValid = (password) => {
    const re = /.{6,}/;
    return re.test(password);
}
module.exports = {
    isEmailValid,
    isPasswordValid
}