"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureSupertokens = configureSupertokens;
const supertokens_node_1 = __importDefault(require("supertokens-node"));
const session_1 = __importDefault(require("supertokens-node/recipe/session"));
const emailpassword_1 = __importDefault(require("supertokens-node/recipe/emailpassword"));
const database_1 = require("../config/database");
function configureSupertokens() {
    supertokens_node_1.default.init({
        framework: "express",
        supertokens: {
            connectionURI: process.env.SUPERTOKENS_CONNECTION_URI || "",
            apiKey: process.env.SUPERTOKENS_API_KEY,
        },
        appInfo: {
            appName: "Finance Tracker",
            apiDomain: process.env.API_DOMAIN || "",
            websiteDomain: process.env.WEBSITE_DOMAIN || "",
            apiBasePath: "/auth",
            websiteBasePath: "/auth",
        },
        recipeList: [
            emailpassword_1.default.init({
                override: {
                    apis: (originalImplementation) => {
                        return {
                            ...originalImplementation,
                            signUpPOST: async function (input) {
                                if (!originalImplementation.signUpPOST) {
                                    throw new Error("signUpPOST is not defined in the original implementation");
                                }
                                const response = await originalImplementation.signUpPOST(input);
                                if (response.status === "OK") {
                                    const { id, emails } = response.user;
                                    // Create user in your database
                                    await database_1.prisma.user.create({
                                        data: {
                                            id,
                                            email: emails[0],
                                            categories: {
                                                createMany: {
                                                    data: [
                                                        { name: "Salary", type: "INCOME" },
                                                        { name: "Groceries", type: "EXPENSE" },
                                                        { name: "Rent", type: "EXPENSE" },
                                                        { name: "Transportation", type: "EXPENSE" },
                                                        { name: "Entertainment", type: "EXPENSE" },
                                                        { name: "Utilities", type: "EXPENSE" },
                                                    ],
                                                },
                                            },
                                        },
                                    });
                                }
                                return response;
                            },
                        };
                    },
                },
            }),
            session_1.default.init({
                override: {
                    functions: (originalImplementation) => {
                        return {
                            ...originalImplementation,
                            createNewSession: async function (input) {
                                return originalImplementation.createNewSession(input);
                            },
                        };
                    },
                },
            }),
        ],
    });
}
