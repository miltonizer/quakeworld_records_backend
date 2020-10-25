const UserService = require( "../../../services/user_service" );
const UserRepository = require("../../../repositories/user_repository");
const User = require( "../../../models/User");
const ApplicationError = require('../../../util/errors/application_error');

beforeAll(() => {

});

afterAll(() => {
    
});

describe('Test set for UserService.createUser', () => {
    it('should throw an exception if requestBody doesnt have username, email and password', async () => {
        jest.restoreAllMocks();
        jest.spyOn(UserRepository.prototype, 'fetchUser').mockImplementation((user) => {return false;});
        jest.spyOn(UserRepository.prototype, 'saveUser')
            .mockImplementation((user) => {
                return new User(
                    "username",
                    "email",
                    "password",
                    false,
                    false,
                    666
                );
        });

        expect.assertions(4);

        const userService = new UserService();
        let requestBody = {};
        await expect(userService.createUser(requestBody)).rejects.toThrow();
        requestBody.username = "username";
        await expect(userService.createUser(requestBody)).rejects.toThrow();
        requestBody.email = "email";
        await expect(userService.createUser(requestBody)).rejects.toThrow();
        requestBody.password = "password";
        await expect(userService.createUser(requestBody)).resolves.toBeDefined();
    });

    it('should throw an ApplicationError if user exists already', async () => {
        jest.restoreAllMocks();
        jest.spyOn(UserRepository.prototype, 'fetchUser').mockImplementation((user) => {return true;});

        expect.assertions(1);
        const userService = new UserService();
        let requestBody = {};

        requestBody.username = "username";
        requestBody.email = "email";
        requestBody.password = "password";
        await expect(userService.createUser(requestBody)).rejects.toThrow(ApplicationError);      
    });

    it('should return proper user and token when given validated user', async () => {
        jest.restoreAllMocks();
        jest.spyOn(UserRepository.prototype, 'fetchUser').mockImplementation((user) => {return false;});
        jest.spyOn(UserRepository.prototype, 'saveUser')
            .mockImplementation((user) => {
                return new User(
                    "username",
                    "email",
                    "password",
                    false,
                    false,
                    666
                );
        });

        expect.assertions(1);
        const userService = new UserService();
        let requestBody = {};

        requestBody.username = "username";
        requestBody.email = "email";
        requestBody.password = "password";
        const user = new User(
            "username",
            "email",
            "password",
            false,
            false,
            666
        );
        await expect(userService.createUser(requestBody)).resolves.toEqual({
            user: user,
            token: expect.anything()
        });      
    });
});

