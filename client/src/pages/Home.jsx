import { v4 as uuid } from "uuid";
import { useNavigate } from "react-router-dom";

export default function Home() {
    const navigate = useNavigate();

    const createRoom = () => {
        navigate(`/room/${uuid()}`);
    };

    return (
        <div className="flex items-center justify-center h-screen">
            <button onClick={createRoom} className=" px-4 py-2 bg-blue-500 text-white rounded">
                Create Room
            </button>
        </div>
    );
}