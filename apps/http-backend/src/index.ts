import express, { Request } from "express";
import { JWT_SECRET } from "@repo/backend-common/config";
import { prismaClient } from "@repo/db/client";
import jwt from "jsonwebtoken";
import { middleware } from "./middleware";
import { CreateUserSchema, SigninSchema, CreateRoomSchema } from "@repo/common/types";
import bcrypt from "bcrypt";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

const app = express();
app.use(express.json());
app.post("/signup", async (req, res) => {
  const parsed = CreateUserSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      msg: "Invalid input",
      error: parsed.error,
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(parsed.data.password, 10);

    const user = await prismaClient.user.create({
      data: {
        email: parsed.data.username,
        password: hashedPassword,
        name: parsed.data.name,
      },
    });

    return res.json({
      userId: user.id,
    });
  } catch (e) {
    return res.status(409).json({
      msg: "User already exists",
    });
  }
});

/**
 * ✅ SIGNIN
 */
app.post("/signin", async (req, res) => {
  const parsed = SigninSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      msg: "Invalid input",
      error: parsed.error,
    });
  }

  const user = await prismaClient.user.findUnique({
    where: {
      email: parsed.data.username,
    },
  });

  if (!user) {
    return res.status(403).json({
      msg: "User not found",
    });
  }

  const isValid = await bcrypt.compare(
    parsed.data.password,
    user.password
  );

  if (!isValid) {
    return res.status(403).json({
      msg: "Incorrect password",
    });
  }

  const token = jwt.sign(
    { userId: user.id },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  return res.json({
    token,
  });
});

/**
 * ✅ CREATE ROOM
 */
app.post("/room", middleware, async (req, res) => {
  const parsed = CreateRoomSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      msg: "Invalid input",
    });
  }

  try {
    const room = await prismaClient.room.create({
      data: {
        slug: parsed.data.username,
        adminId: req.userId!,
      },
    });

    return res.json({
      roomId: room.id,
    });
  } catch (e) {
    return res.status(409).json({
      msg: "Room already exists",
    });
  }
});

/**
 * ✅ GET ALL ROOMS (BONUS)
 */
app.get("/rooms", async (req, res) => {
  const rooms = await prismaClient.room.findMany();

  res.json({
    rooms,
  });
});

/**
 * ✅ START SERVER
 */
app.listen(3001, () => {
  console.log("Server running on port 3001 🚀");
});