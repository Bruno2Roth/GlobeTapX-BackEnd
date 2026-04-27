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