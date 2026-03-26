import axios from "axios";
import { BACKEND_URL } from "../../config";
import { ChatRoom } from "../../../components/ChatRoom";


async function getRoomId(slug: string){
   const response = await axios.get(`${BACKEND_URL}/room/${slug}`);

   if (!response.data.room) {
      throw new Error("Room not found");
   }

   return response.data.room.id;
}
export default async function ChatRoom1({ params }: { params: { slug: string } }) {
    try {
        const slug = params.slug;
        const roomId = await getRoomId(slug);

        return <ChatRoom id={roomId} />;
    } catch (err) {
        return <div>Room not found</div>;
    }
}