const express = require('express')
const router = express.Router()
const auth = require('../middlewares/auth')
const { getResumenGeneral, getRecaudacionPorZona, getEstadoDelMes, getEvolucionMensual, getTopMorosos, getProximasAVencer, getResumenPorZona } = require('../controllers/dashboard.controller')

router.get('/resumen', auth, getResumenGeneral);
router.get('/recaudacion-por-zona', auth, getRecaudacionPorZona);
router.get('/estado-del-mes', auth, getEstadoDelMes);
router.get('/evolucion-mensual', auth, getEvolucionMensual);
router.get('/top-morosos', auth, getTopMorosos);
router.get('/proximas-a-vencer', auth, getProximasAVencer);
router.get('/resumen-zona', auth, getResumenPorZona);


module.exports = router;