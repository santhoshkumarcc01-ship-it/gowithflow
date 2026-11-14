const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const JWT_SECRET = process.env.SESSION_SECRET || 'campus_secret_key_change_me_in_production';

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  // Socket.IO Middleware for Cookie/Session Parsing
  io.use((socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie || '';
      const sessionCookie = cookieHeader
        .split('; ')
        .find(row => row.startsWith('ai_campus_session='));

      if (!sessionCookie) {
        return next(new Error('Authentication cookie missing'));
      }

      const token = sessionCookie.split('=')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      
      socket.user = decoded;
      next();
    } catch (err) {
      console.warn('[SOCKET] Unauthorized connection attempt');
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;
    console.log(`[SOCKET] User connected: ${user.name} (${user.role}) [ID: ${socket.id}]`);

    // Join user-specific room
    socket.join(`user:${user.id}`);
    
    if (user.role === 'STUDENT') {
      socket.join(`student:${user.studentId}`);
    } else if (user.role === 'FACULTY') {
      socket.join(`faculty:${user.facultyId}`);
    }

    socket.on('disconnect', () => {
      console.log(`[SOCKET] User disconnected: ${user.name}`);
    });
  });

  // Attach io instance globally or expose it if needed
  global.io = io;

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});
