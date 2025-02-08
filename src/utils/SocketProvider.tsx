import React, { createContext, useContext, useEffect, useState } from "react";
import { Socket, io } from "socket.io-client";
import { BASEURL } from "./api/config";

interface SocketContextType {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextType>({ socket: null });

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io(BASEURL);
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("connected to socket server...");
    });

    newSocket.on("disconnect", () => {
      console.log("disconnected from socket server...");
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
