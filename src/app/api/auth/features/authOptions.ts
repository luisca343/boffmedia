import { AuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials";
import { boffPOST } from '@/services/boffAPI';

export const authOptions: AuthOptions = {
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
            const user = await res

            

            if (user && !user.error) {
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
              const user = await res

              console.log(user)

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
}