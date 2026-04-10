import express from "express"
import axios from "axios"
import cors from "cors";   

const app = express();
const port = 3000;   

// Agrego los Middlewares

app.use(cors());          // Middleware de CORS
app.use(express.json());  // Middleware para parsear y comprender JSON