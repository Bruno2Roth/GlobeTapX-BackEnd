backend/
│
├── package.json          # dependencias y scripts
├── package-lock.json
├── .env                  # variables de entorno
├── .gitignore
│
├── src/
│
│   ├── api/                          
│   │   ├── controllers/
│   │   │   ├── usuario.js
│   │   │   └── evento.js
│   │   │
│   │   ├── routes/
│   │   │   ├── usuario.js
│   │   │   └── evento.js
│   │   │
│   │   ├── middlewares/
│   │   │   └── auth.js
│   │   │
│   │   └── dtos/
│   │       ├── input/
│   │       └── output/
│
│   ├── application/                  
│   │   ├── services/
│   │   │   ├── usuario.js
│   │   │   └── evento.js
│   │   │
│   │   └── models/
│   │       ├── Usuario.js
│   │       └── EventoPais.js
│
│   ├── data/                         # DATA
│   │   ├── repositories/
│   │   │   ├── usuario.js
│   │   │   └── evento.js
│   │   │
│   │   └── infrastructure/
│   │       ├── database/
│   │       │   └── connection.js
│   │       │
│   │       ├── external/
│   │       └── email/
│
│   ├── config/
│   │   └── env.js
│
│   ├── utils/
│   ├── errors/
│
│   └── app/
│       └── app.js        # configuración de Express
│
├── server/
│   └── server.js         # 🔥 ENTRY POINT (equivalente a index)
│
└── tests/


CONTROLLERS SERVICIES REPOSITORIES (BD)

Cómo ejecutar
----------------
- Iniciar la aplicación (producción/local):

```bash
npm start
```

- Modo desarrollo con recarga automática (usa el watcher de Node):

```bash
npm run watch
```

Si prefieres usar `nodemon` para desarrollo, instala con `npm i -D nodemon` y ejecuta `npx nodemon index.js`.