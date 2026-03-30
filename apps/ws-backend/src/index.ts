import { WebSocketServer, WebSocket } from "ws";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const wss = new WebSocketServer({ port: 8080 });
interface JwtPayload {
  userId: string;
}
interface User {
  ws: WebSocket;
  rooms: number[];
  userId: string;
}

const users: User[] = [];

// ✅ Verify JWT safely
function checkUser(token: string): string | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded.userId;
  } catch (e) {
    return null;
  }
}

wss.on("connection", async (ws, request) => {
  try {
    // ✅ Safe URL parsing
    const url = new URL(request.url!, "http://localhost");
    const token = url.searchParams.get("token") || "";

    const userId = checkUser(token);

    if (!userId) {
      ws.close();
      return;
    }

    // ✅ Check user exists in DB (CRITICAL FIX)
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      console.log("❌ User not found in DB:", userId);
      ws.close();
      return;
    }

    console.log("✅ User connected:", userId);

    const user: User = {
      ws,
      rooms: [],
      userId,
    };

    users.push(user);

    ws.on("message", async (data) => {
      let parsedData;

      // ✅ Safe JSON parsing
      try {
        parsedData = JSON.parse(data.toString());
      } catch {
        console.log("Invalid JSON");
        return;
      }

      // ✅ JOIN ROOM
      if (parsedData.type === "join_room") {
        user.rooms.push(parsedData.roomId);
      }

      // ✅ LEAVE ROOM (FIXED)
      if (parsedData.type === "leave_room") {
        user.rooms = user.rooms.filter(
          (roomId) => roomId !== parsedData.roomId
        );
      }

      // ✅ CHAT MESSAGE
      if (parsedData.type === "chat") {
        const { roomId, message } = parsedData;

        try {
          // 🔥 Check room exists
          const room = await prisma.room.findUnique({
            where: { id: roomId },
          });

          if (!room) {
            console.log("❌ Room not found");
            return;
          }

          // 🔥 Store message
          await prisma.chat.create({
            data: {
              roomId,
              message,
              userId,
            },
          });

          // 🔥 Broadcast
          users.forEach((u) => {
            if (u.rooms.includes(roomId)) {
              u.ws.send(
                JSON.stringify({
                  type: "chat",
                  message,
                  roomId,
                })
              );
            }
          });
        } catch (e) {
          console.log("❌ Chat error:", e);
        }
      }
    });

    // ✅ Cleanup on disconnect
    ws.on("close", () => {
      const index = users.findIndex((u) => u.ws === ws);
      if (index !== -1) {
        users.splice(index, 1);
      }
      console.log("🔴 User disconnected");
    });
  } catch (e) {
    console.log("Connection error:", e);
    ws.close();
  }
});