import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { useQueryClient } from '@tanstack/react-query';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false });

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, currentOrg, isAuthenticated } = useAuth();
  const { info, success } = useToast();
  const queryClient = useQueryClient();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const token = localStorage.getItem('cf_access_token');
    const socketInstance = io(window.location.origin, {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      if (currentOrg?.id) {
        socketInstance.emit('join:org', currentOrg.id);
      }
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    // Real-time events
    socketInstance.on('lead.created', (lead) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      info('New Lead Added', `${lead.firstName} ${lead.lastName} from ${lead.company || 'Unknown'}`);
    });

    socketInstance.on('lead.updated', () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    });

    socketInstance.on('lead.assigned', (lead) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      info('Lead Assigned', `Lead ${lead.firstName} ${lead.lastName} assigned to you`);
    });

    socketInstance.on('deal.stageChanged', (deal) => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['pipeline'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      if (deal.stage === 'CLOSED_WON') {
        success('Deal Won! 🎉', `"${deal.title}" closed for $${deal.amount.toLocaleString()}`);
      }
    });

    socketInstance.on('task.assigned', (task) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      info('Task Assigned', task.title);
    });

    socketInstance.on('task.created', () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    });

    socketInstance.on('notification.created', (notif) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      info(notif.title, notif.message);
    });

    socketInstance.on('subscription.updated', () => {
      queryClient.invalidateQueries({ queryKey: ['billing'] });
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [isAuthenticated, user?.id, currentOrg?.id]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
