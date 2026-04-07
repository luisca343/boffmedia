/*
import { Loading } from "@/components/smartrotom/Loading";
import axios from 'axios';

import {Actions} from '@pkmn/login';
import {Protocol} from '@pkmn/protocol';

const server = 'sim.smogon.com';
const serverport = 8000;





export default function ChatApp() {

    const ws = new WebSocket(`ws://${server}:${serverport}/showdown/websocket`);
    // @ts-ignore
    ws.on('message', message => {
        message = message.toString('utf8');
        
        for (const {args} of Protocol.parse(message)) {
          switch (args[0]) {
            case 'challstr': {
              const challstr = args[1];
              onChallstr(challstr);
              break;
            }
          }
        }
        });

        async function onChallstr(challstr: string) {
            console.log("LOGIN");
            console.log(challstr);
            const action = Actions.login({username: 'luisca343', password: 'password', challstr});
            const response = await (await fetch(action.url, {
              method: action.method,
              headers: action.headers,
              body: action.data,
            })).text();
            const cmd = action.onResponse(response);
            if (cmd) ws.send(cmd);
          }


    return (
        <Loading />
    );
}*/