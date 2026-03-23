import { WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config"


interface JwtPayLoad {
    userId: string;
}

const wss = new WebSocketServer({ port: 8080});

wss.on('connection', function(ws, request){
    // extraction of token
    const url = request.url;
    if(!url){
        return;
    }
    const queryParams = new URLSearchParams(url.split('?')[1]);
    const token = queryParams.get('token') || "";
    const decoded = jwt.verify(token, JWT_SECRET);


    if(!decoded || !(decoded as JwtPayLoad).userId){
        ws.close();
        return;
    }

    ws.on('message', function message(data){
        ws.send('pong')
    });
});