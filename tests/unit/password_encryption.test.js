const {hashPassword, verifyPassword} = require('../../util/password_encryption');
const argon2 = require('argon2');

describe('Test set for util/password_encryption.js hashPassword', () => {
    it('should return a password hashed with argon2 when given a password', async () => {
        expect.assertions(1);
        const hashedPassword = await hashPassword("password");
        await expect(argon2.verify(hashedPassword, "password")).resolves.toEqual(true);
    });

    it('should throw an error when no password is given', async () => {
        expect.assertions(1);
        await expect(hashPassword()).rejects.toThrow();
    });
});

describe('Test set for util/password_encryption.js verifyPassword', () => {
    it('should return true when given matching password and hash', async () => {
        expect.assertions(1);
        const hashedPassword = await argon2.hash("password", {
            type: argon2.argon2id,
        });
        await expect(verifyPassword(hashedPassword, "password")).resolves.toEqual(true);
    });

    it('should return false when given password and hash that do not match', async () => {
        expect.assertions(1);
        const hashedPassword = await argon2.hash("password666", {
            type: argon2.argon2id,
        });
        await expect(verifyPassword(hashedPassword, "password")).resolves.toEqual(false);
    });

    it('should throw an error when either of the arguments is not given', async () => {
        expect.assertions(3);
        await expect(verifyPassword('', "password")).rejects.toThrow();
        await expect(verifyPassword('$hash', '')).rejects.toThrow();
        await expect(verifyPassword('', '')).rejects.toThrow();
    });
});