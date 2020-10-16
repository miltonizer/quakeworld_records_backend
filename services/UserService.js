const UserRepository = require( "../repositories/UserRepository" );
const userRepository = new UserRepository();

class UserService {
    constructor () {
        
    }

    async userExists( userObject ) {
        return await userRepository.userExists(userObject);
    }

    async createUser ( userObject ) {

    }
}
module.exports = UserService;