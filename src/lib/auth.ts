import {checkout,polar,portal} from "@polar-sh/better-auth"
import { polarClient } from "./polar";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./db";
export const auth = betterAuth({
    database : prismaAdapter(prisma,{
        provider:"postgresql",
    }),
    emailAndPassword:{
        enabled:true,
        autoSignIn:true,
    },
    plugins:[
        polar({
            client: polarClient,
            createCustomerOnSignUp:true,
            use:[
                checkout({
                    products:[
                        {
                        productId:"13b3f73d-7c29-45c0-9dd2-6b2053fadd6e",
                        slug:"pro",
                        }
                    ],
                    successUrl:process.env.POLAR_SUCCESS_URL,
                    authenticatedUsersOnly:true,
                }),
                portal()
            ],
        })
    ]
});