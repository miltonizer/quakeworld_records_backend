const db = require('../../database/');
const User = require( "../../models/user");

async function insertUserToDatabase(username, email, password, admin, superadmin) {
    // Creating a superadmin to get a valid id and token for him
    let sql = `INSERT INTO public.user (username,
                        email, 
                        password, 
                        admin, 
                        superadmin) 
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id, username, email, admin, superadmin`;
    let sqlParameters = [
        username,
        email,
        password,
        admin,
        superadmin
    ];

    const res = await db.query(sql, sqlParameters);
    const user = new User(
        res.rows[0].username, 
        res.rows[0].email,
        res.rows[0].password,
        res.rows[0].admin,
        res.rows[0].superadmin,
        res.rows[0].id
    );
    return user;
}

module.exports.insertUserToDatabase = insertUserToDatabase;