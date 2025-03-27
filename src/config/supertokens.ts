import supertokens from "supertokens-node";
import Session from "supertokens-node/recipe/session";
import EmailPassword from "supertokens-node/recipe/emailpassword";
import { PrismaClient } from "@prisma/client";

import { prisma } from "../config/database";

export function configureSupertokens() {
  supertokens.init({
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
      EmailPassword.init({
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
                  await prisma.user.create({
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
      Session.init({
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
