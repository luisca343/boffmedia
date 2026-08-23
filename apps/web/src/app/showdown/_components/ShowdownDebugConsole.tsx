'use client'

import { useState, useEffect } from 'react'
import { env } from '@/config/env.public'
import { io, Socket } from 'socket.io-client'

import { Args, Protocol } from '@pkmn/protocol'
import { UpdateUserResult, QueryType } from '../util/types'
import { handleChallstr, handleFormats, handleUpdateSearch, handleUpdateUser } from '../util/queryHandler'

const API_BASE_URL = env.NEXT_PUBLIC_API
const SERVER = `${API_BASE_URL}/showdown`
const RECONNECT_INTERVAL = 5000 // 5 seconds

type Message = {
  type: 'info' | 'error' | 'sent' | 'received'
  content: string
}

export function ShowdownDebugConsole() {
  const [messages, setMessages] = useState<Message[]>([])
  const [socket, setSocket] = useState<Socket | null>(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [challstr, setChallstr] = useState('')

  const [battles, setBattles] = useState<{
    [roomid: string]: string
  }>({})

  function addMessage(type: Message['type'], content: string) {
    setMessages(prev => [...prev, { type, content }])
  }

  function connectWebSocket() {
    if (socket) {
      socket.disconnect()
    }

    const newSocket = io(SERVER)

    newSocket.on('connect', () => {
      console.log('Connected to Nest.js server')
      addMessage('info', 'Connected to Nest.js server')
      setIsConnected(true)
    })

    newSocket.on('message', (message) => {
      console.log(message)
    })


    newSocket.on('showdownMessage', (data: string) => {
      let roomid = 'lobby';
      if (data.charAt(0) === '>') {
        const nlIndex = data.indexOf('\n');
        if (nlIndex < 0) return;
        roomid = toRoomid(data.substring(1, nlIndex));
        data = data.substring(nlIndex + 1);
      }

      const lines = data.split('\n');

      lines.forEach((line) => {
        const message = Protocol.parseLine(line) as any;

        if (!message) return;

        const queryType = message[0] as QueryType;

        switch (queryType) {
          case 'updateuser':
            const updateUser = handleUpdateUser(message);
            console.log('Update user:', updateUser);
            break;
          case 'challstr':
            const challStrResult = handleChallstr(message);
            setChallstr(challStrResult.challstr);
            break;
          case 'formats':
            const formats = handleFormats(message);
            console.log('Formats:', formats);
            break;
          case 'updatesearch':
            const updateSearch = handleUpdateSearch(message);
            break;
          default:
            console.warn(`Unhandled message type: ${queryType}`, message);
        }

        console.log(`[${roomid}]:`, message);
        addMessage('received', `[${roomid}]: ${line}`);
      });

      /*
      if (data.startsWith('|challstr|')) {
        const newChallstr = data.slice(10)
        setChallstr(newChallstr)
      }*/
    })

    newSocket.on('disconnect', (reason) => {
      console.log('Disconnected from Nest.js server', reason)
      addMessage('error', `Disconnected: ${reason || 'Unknown reason'}`)
      setIsConnected(false)
      setChallstr('')

      // Attempt to reconnect
      setTimeout(connectWebSocket, RECONNECT_INTERVAL)
    })

    newSocket.on('error', (error) => {
      console.error('Socket error:', error)
      addMessage('error', `Socket error: ${error.toString()}`)
    })

    newSocket.on('loginSuccess', (content) => {
      const parsed = Protocol.parseLine(content)
      console.log('Login successful:', parsed)
      addMessage('info', `Login successful: ${content}`)
    })

    newSocket.on('loginError', (error) => {
      addMessage('error', `Login failed: ${error}`)
    })

    setSocket(newSocket)
  }

  useEffect(() => {
    connectWebSocket()

    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
  }, [])

  function sendMessage(message: string) {
    if (socket && socket.connected) {
      socket.emit('sendToShowdown', message)
      addMessage('sent', `Sent: ${message}`)
    } else {
      addMessage('error', 'Cannot send message: Not connected')
    }
  }

  function handleLogin() {
    if (!username || !password) {
      addMessage('error', 'Login failed: Username or password not set')
      return
    }

    if (!challstr) {
      addMessage('error', 'Login failed: Challenge string not received')
      return
    }

    if (socket && socket.connected) {
      socket.emit('login', { username, password, challstr })
    } else {
      addMessage('error', 'Cannot login: Not connected to server')
    }
  }

  return (
    <div className="p-4 h-full flex flex-col">
    <nav>
        {Object.entries(battles).map(([roomid, battle]) => (
          <div key={roomid} className="flex items-center">
            {battle}
          </div>
        ))}
    </nav>
      <h1 className="text-2xl font-bold mb-4">Showdown Connection</h1>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="border p-2 mr-2"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 mr-2"
        />
        <button
          className="bg-secondary hover:bg-secondary-active text-white font-bold py-2 px-4 rounded"
          onClick={handleLogin}
          disabled={!isConnected || !challstr}
        >
          Login
        </button>
      </div>
      <div className="mb-4">
        <button
          className={`bg-warning hover:bg-warning text-white font-bold py-2 px-4 rounded mr-2 ${
            !isConnected && 'opacity-50 cursor-not-allowed'
          }`}
          onClick={() => sendMessage('|/join lobby')}
          disabled={!isConnected}
        >
          Join Lobby
        </button>
        <button
          className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"
          onClick={connectWebSocket}
        >
          Reconnect
        </button>
      </div>
      <div className="border p-4 flex-1 overflow-y-auto">
        {messages.map((msg, index) => (
          <p key={index} className={`${
            msg.type === 'error' ? 'text-red-500' :
            msg.type === 'sent' ? 'text-secondary' :
            msg.type === 'received' ? 'text-warning' :
            'text-ink-dim'
          }`}>
            {msg.content}
          </p>
        ))}
      </div>
    </div>
  )
}


function toRoomid(roomid: string) {
	return roomid.replace(/[^a-zA-Z0-9-]+/g, '').toLowerCase();
}

