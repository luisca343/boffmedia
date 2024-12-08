'use client'

import { useState, useEffect, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

import { Protocol } from '@pkmn/protocol'

const SERVER = 'http://localhost:34305'
const RECONNECT_INTERVAL = 5000 // 5 seconds

type Message = {
  type: 'info' | 'error' | 'sent' | 'received'
  content: string
}

export default function ShowdownPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [socket, setSocket] = useState<Socket | null>(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [challstr, setChallstr] = useState('')

  const addMessage = useCallback((type: Message['type'], content: string) => {
    setMessages(prev => [...prev, { type, content }])
  }, [])

  const connectWebSocket = useCallback(() => {
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
      if (data.charAt(0) === '>') {
        const nlIndex = data.indexOf('\n');
        if (nlIndex < 0) return;
        const roomid = toRoomid(data.substring(1, nlIndex));
        data = data.substring(nlIndex + 1);
    }

    const lines = data.split('\n');

    lines.forEach((line) => {
        const parsed = Protocol.parseLine(line);
        console.log('Parsed message:', parsed);
        addMessage('received', `Received: ${line}`);
    });

    /*
      addMessage('received', `Received: ${data}`)

      const parsed = Protocol.parseLine(data)
      console.log('Parsed message:', parsed)*/

      if (data.startsWith('|challstr|')) {
        const newChallstr = data.slice(10)
        setChallstr(newChallstr)
      }
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
  }, [addMessage])

  useEffect(() => {
    connectWebSocket()

    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
  }, [connectWebSocket])

  const sendMessage = (message: string) => {
    if (socket && socket.connected) {
      socket.emit('sendToShowdown', message)
      addMessage('sent', `Sent: ${message}`)
    } else {
      addMessage('error', 'Cannot send message: Not connected')
    }
  }

  const handleLogin = () => {
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
    <div className="p-4">
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
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={handleLogin}
          disabled={!isConnected || !challstr}
        >
          Login
        </button>
      </div>
      <div className="mb-4">
        <button
          className={`bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mr-2 ${
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
      <div className="border p-4 h-64 overflow-y-auto">
        {messages.map((msg, index) => (
          <p key={index} className={`${
            msg.type === 'error' ? 'text-red-500' :
            msg.type === 'sent' ? 'text-blue-500' :
            msg.type === 'received' ? 'text-green-500' :
            'text-gray-700'
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
