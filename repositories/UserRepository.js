const db = require('../database');

class UserRepository {

    constructor () {
        // Create instance of Data Access layer using our desired model
        //this.MongooseServiceInstance = new MongooseService( PostModel );
    }

    async userExists (userObject) {
        const { username, email } = userObject;
        const text = 'SELECT * FROM USER WHERE email = $1 OR username =$2';
        const values = [email, username];
        try {
            const res = await db.query(text, values);
            return res;
        } 
        catch (err) {
            console.log(err.stack)
        }

    }
}
module.exports = UserRepository;