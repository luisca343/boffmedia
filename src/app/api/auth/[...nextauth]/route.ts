import NextAuth from 'next-auth';
import CredentialsProvider from "next-auth/providers/credentials";
import { User, Account, Profile } from 'next-auth';
import { boffPOST } from '@/services/boffAPI';

const handler = NextAuth({
    pages: {
    },
    providers: [
        CredentialsProvider({
            id: "boffmedia",
          name: "BoffMedia",
          credentials: {
            username: { label: "Username", type: "text", placeholder: "jsmith" },
            password: { label: "Password", type: "password" }
          },
          async authorize(credentials, req) {
            const res = await boffPOST(`/users/login`, credentials)
            const user = await res.data

            

            if (user) {
              return Promise.resolve(user)
            } else {
              return Promise.resolve(null)
            }
          
          }
        }),
        
        CredentialsProvider({
            id: "minecraft",
            name: "Minecraft",
            credentials: {
              username: { label: "Username", type: "text", placeholder: "jsmith" },
              uuid: { label: "UUID", type: "text", placeholder: "" },
              world: { label: "World", type: "text", placeholder: "" }
            },
        
            async authorize(credentials, req) {
              const res = await boffPOST(`/users/loginmc`, credentials)
              const user = await res.data

              if (user && !user.error) {
                return Promise.resolve(user)
              } else {
                return Promise.resolve(null)
              }
            
            }
          })
      ],
        secret: process.env.SECRET,
        callbacks: {
            async jwt({token, user}) {
            if (user) {
                return { ...token, ...user };
            }
            return token;
            },
            async session({session, token}) {
            return { ...session, user: { ...token } };
            },
        },
})


export {handler as GET, handler as POST}