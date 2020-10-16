class User {
    constructor (username, email, admin, superadmin) {
        this.username = username;
        this.email = email;
        this.admin = admin;
        this.superadmin = superadmin;
    }
}
module.exports = User;