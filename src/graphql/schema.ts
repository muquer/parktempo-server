import { databasePool } from '../database/database-pool'
import {
    GraphQLObjectType,
    GraphQLString,
    GraphQLInt,
    GraphQLSchema,
    GraphQLList,
    GraphQLNonNull,
} from 'graphql';

//UserType
const UserType = new GraphQLObjectType({
    name: 'User',
    fields: () => ({
        userId: { type: GraphQLString },
        email: { type: GraphQLString },
    })
});

//WhitelistedVehicleType
const WhitelistedVehicleType = new GraphQLObjectType({
    name: 'WhitelistedVehicle',
    fields: () => ({
        vehicleId: { type: GraphQLInt },
        owner: { type: GraphQLString },
        licensePlateNumber: { type: GraphQLString },
        startTime: { type: GraphQLString },
        endTime: { type: GraphQLString },
        dateAdded: { type: GraphQLString },
    })
});


// Root Query
const RootQuery = new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
        users: {
            type: GraphQLList(UserType),
            resolve(parentValue, args, context) {
                //if (context[process.env.AUTH0_ROLE_URL] != "Admin") return null; toremove
                return databasePool.getUserList()
            }
        },
        user: {
            type: UserType,
            args: {
                userId: { type: GraphQLInt },
            },
            resolve(parentValue, args, context) {
                if (context[`${process.env.AUTH0_URL}/role`] != "Admin") return null;
                return databasePool.getUser(Number(args.userId))
            }
        },
        whitelistedVehicles: {
            type: GraphQLList(WhitelistedVehicleType),
            args: {},
            resolve(parentValue, args, context) {
                return databasePool.getVehicleList(context)
            }
        }
    }
});

// Mutations
const mutation = new GraphQLObjectType({
    name: 'Mutation',
    fields: {
        addWhiteListEntry: {
            type: GraphQLList(WhitelistedVehicleType),
            args: {
                licensePlateNumber: { type: new GraphQLNonNull(GraphQLString) },
                startTime: { type: GraphQLString },
                endTime: { type: GraphQLString }
            },
            resolve(parentValue, args, context) {
                return databasePool.addWhiteListEntry(args.licensePlateNumber, args.startTime, args.endTime, context)
            }
        },
        deleteWhitelistEntry: {
            type: GraphQLList(WhitelistedVehicleType),
            args: {
                vehicleId: { type: new GraphQLNonNull(GraphQLInt) }
            },
            resolve(parentValue, args, context) {
                return databasePool.deleteWhiteListEntry(args.vehicleId, context)
            }
        },
        editWhitelistEntry: {
            type: GraphQLList(WhitelistedVehicleType),
            args: {
                vehicleId: { type: new GraphQLNonNull(GraphQLInt) },
                licensePlateNumber: { type: new GraphQLNonNull(GraphQLString) },
                startTime: { type: GraphQLString },
                endTime: { type: GraphQLString }
            },
            resolve(parentValue, args, context) {
                return databasePool.editWhiteListEntry(args.vehicleId, args.licensePlateNumber, args.startTime, args.endTime, context);
            }
        },
    }
});

export { databasePool }
export const schema = (new GraphQLSchema({
    query: RootQuery,
    mutation
}))