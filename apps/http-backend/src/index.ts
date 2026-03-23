import express from "express"
import { JWT_SECRET } from "@repo/backend-common/config"
import jwt from "jsonwebtoken";
import { middleware } from "./middleware";
import { CreateUserSchema, SigninSchema, CreateRoomSchema } from "@repo/common/types"

const app = express();

app.post('/signup', (req,res) =>{
    const data = CreateUserSchema.safeParse(req.body);
    if(!data.success){
         res.json({
            msg: "Incorrect credentials"
        })
        return;
    }
    //db call
    
})
app.post('/signin', (req,res) =>{
    const data = SigninSchema.safeParse(req.body);
    if(!data.success){
         res.json({
            msg: "Incorrect credentials"
        })
        return;
    }

    const userId = 1;
    const token = jwt.sign({
        userId
    }, JWT_SECRET);
    res.json({
        token
    })

})
app.post('/room',middleware, (req,res) =>{
    const data = CreateRoomSchema.safeParse(req.body);
    if(!data.success){
         res.json({
            msg: "Incorrect credentials"
        })
        return;
    }

    // db call
    res.json({
        room:123
    })

})

app.listen(3001);