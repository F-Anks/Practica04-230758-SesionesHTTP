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

app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 

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
    const { sessionId, email, nickname } = req.body;

    if (!sessionId || !sessions[sessionId]) {
        return res.status(404).json({
            message: "No existe una sesión activa"
        });
    }

    if (email) sessions[sessionId].email = email;
    if (nickname) sessions[sessionId].nickname = nickname;
    sessions[sessionId].lastAccessed = new Date();

    res.status(200).json({
        message: "Datos actualizados con éxito",
        session: sessions[sessionId]
    });
});

app.get("/status", (req, res) => {
    const sessionId = req.query.sessionId; 

    if (!sessionId || !sessions[sessionId]) {
        return res.status(404).json({
            message: "No hay sesión activa"
        });
    }

    const session = sessions[sessionId];
    const sessionDateCreated = moment.utc(session.dateCreated).tz("America/Mexico_City").format("YYYY-MM-DD HH:mm:ss");
    const sessionLastAccessed = moment.utc(session.lastAccessed).tz("America/Mexico_City").format("YYYY-MM-DD HH:mm:ss");

    res.status(200).json({
        message: "Sesión activa",
        session: {
            ...session,
            dateCreated: sessionDateCreated,
            lastAccessed: sessionLastAccessed,
        }
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
