import express from "express";
import session from "express-session";
import bodyParser from "body-parser";
import moment from "moment-timezone";
import cors from "cors";
import os from "os";
import { v4 as uuidv4 } from "uuid";

const app = express();
const port = 3000;
const sessions = {};

app.use(bodyParser.json());
app.use(cors());

app.use(express.json()); // Necesita paréntesis
app.use(express.urlencoded({ extended: true })); // También se necesita el paréntesis

app.use(
    session({
        secret: "P4-FGG#doge-SesionesHTTP-VariablesDeSesion",
        resave: false,
        saveUninitialized: false,
        cookie: { maxAge: 5*60*1000 }
    })
)

const getClientIP = (req) => {
    return (
        req.headers["x-forwarded-for"] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket?.remoteAddress
    );
};

app.post("/login", (req, res) => {
    const { email, nickname, macAddress } = req.body;

    if (!email || !nickname || !macAddress) {
        return res.status(400).json({
            message: "Se esperan campos requeridos",
        });
    }

    const sessionId = uuidv4();
    const now = new Date();

    sessions[sessionId] = {
        sessionId,
        email,
        nickname,
        macAddress,
        ip: getClientIP(req),
        dateCreated: now,
        lastAccessed: now,
    };

    res.status(200).json({
        message: "Se ha logueado con éxito",
        sessionId,
    });
});

app.post("/logout", (req, res) => {
    const { sessionId } = req.body;

    if (!sessionId || !sessions[sessionId]) {
        return res.status(404).json({
            message: "No se ha encontrado una sesión activa",
        });
    }

    delete sessions[sessionId];
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send("Error al cerrar la sesión");
        }
    });
 
    res.status(200).json({
        message: "Logout successful",
    });
});

app.put("/update", (req, res) => {
    const { sessionId, email, nickname } = req.body

    if (!sessionId || !sessions[sessionId]) {
        return res.status(404).json({
            message: "No existe una sesion activa"
        })
    }

    if (email) sessions[sessionId].email = email;
    if (nickname) sessions[sessionId].nickname = nickname;
    sessions[sessionId].lastAccessed = new Date();
})

app.get("/status", (req, res) => {
    const sessionId = req.query.sessionId; // Cambié "sesionId" por "sessionId"

    if (!sessionId || !sessions[sessionId]) {
        return res.status(404).json({
            message: "No hay sesión activa"
        });
    }

    res.status(200).json({
        message: "Sesión activa",
        session: sessions[sessionId]
    });
});

app.get('/',(req, res)=>{
    return res.status(200).json({
          message: "Bienvenid@ al API control de sesiones",
          author: "Francisco Garcia Garcia"
    })
})

const getServerNetworkInfo = () =>{
    const interfaces = os.networkInterfaces();
    for(const name in interfaces){
        for(const iface of interfaces[name]){
            if(iface.family === 'IPv4' && !iface.internal){
                return{
                    serverIp: iface.address,
                    serverMAC: iface.mac
                };
            }
        }
    }
}

app.listen(port, () => {
    console.log(`Servidor levantado en el puerto ${port}`);
});
