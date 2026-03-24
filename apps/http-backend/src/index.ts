import express from "express"
import { JWT_SECRET } from "@repo/backend-common/config"
import { prismaClient } from "@repo/db/client"
import jwt from "jsonwebtoken";
import { middleware } from "./middleware";
import { CreateUserSchema, SigninSchema, CreateRoomSchema } from "@repo/common/types"

const app = express();

app.post('/signup', async (req,res) =>{
    const parseData = CreateUserSchema.safeParse(req.body);
    if(!parseData.success){
         res.json({
            msg: "Incorrect credentials"
        })
        return;
    }

    //db call
    try{
        const user = await prismaClient.user.create({
        data: {
            email: parseData.data?.username,
            password: parseData.data.password,
            name: parseData.data.name
        }
    });

    const token = jwt.sign({
        userId: user.id
    }, JWT_SECRET);

    res.json({
        token
    })
    } catch(e) {
        res.status(411).json({
            msg: "User already exists with this username"
        })
    }
    
    
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