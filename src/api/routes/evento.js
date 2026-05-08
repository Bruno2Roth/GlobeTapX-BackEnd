const express = require("express");
const router = express.Router();

const eventoController = require("../controllers/evento");

router.get("/", eventoController.obtenerEventos);

router.get("/:id", eventoController.obtenerEventoPorId);

router.post("/", eventoController.crearEvento);

router.put("/:id", eventoController.actualizarEvento);

router.delete("/:id", eventoController.eliminarEvento);

module.exports = router;