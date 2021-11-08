import express from "express"
import dotenv from 'dotenv'
import { graphqlHTTP } from 'express-graphql';
import cors from 'cors'
import bodyParser from 'body-parser'
import jwt from 'express-jwt'
import jwks from 'jwks-rsa'
import { databasePool } from './graphql/schema'
import { schema } from './graphql/schema'


dotenv.config();

const app = express();

const PORT = process.env.PORT || 3001;

const jwtCheck = jwt({
    secret: jwks.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`
    }),
    issuer: `https://${process.env.AUTH0_DOMAIN}/`,
    algorithms: ['RS256']
});

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cors())


//User db registration
app.post("/register", jwtCheck, async (req, res) => {
    let count = await databasePool.registerUser((req as any).user)
    console.log("registration request received")
    console.log('count', count)
    res.status(200).json(count)
})

app.use('/graphql', jwtCheck, graphqlHTTP(async (req: any) => ({
    schema: schema,
    graphiql: true,
    context: req.user
})));

//test
app.get("/", (req, res) => {
    res.send("sup")
})

//endpoint test
app.get("/users", jwtCheck, async (req, res) => {
    let users = await databasePool.getUserList()
    return res.status(200).json(users)
})

app.listen(PORT, () => {
    console.log(`listening on port ${PORT}`)
})