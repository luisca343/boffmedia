import NextAuth from 'next-auth';
import GooogleProvider from 'next-auth/providers/google';
import { User, Account, Profile } from 'next-auth';

const handler = NextAuth({
    providers:[
        GooogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string
        })
    ],
    events: {
        signIn: async ({user, account, profile}: {user: User, account: Account | null, profile?: Profile} ) => {
            console.log('User signed in:', user);
            console.log('Account:', account);
            console.log("Provider:", account?.provider);
    
            if (account && account.provider === 'google') {
                console.log('User signed in with Google:', user);
                try {
                    await fetch('YOUR_REST_API_ENDPOINT', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                } catch (error) {
                    console.error('Error:', error);
                }
            }
        }
    }
})

export {handler as GET, handler as POST}