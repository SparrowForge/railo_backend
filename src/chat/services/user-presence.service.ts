import { Injectable } from '@nestjs/common';

@Injectable()
export class UserPresenceService {
    private static online_users = new Map<string, Set<string>>();

    /**
     * Add a socket connection for a user
     */
    addSocket(user_id: string, socket_id: string): void {
        const sockets = UserPresenceService.online_users.get(user_id) ?? new Set<string>();
        sockets.add(socket_id);
        UserPresenceService.online_users.set(user_id, sockets);
    }

    /**
     * Remove a socket connection for a user
     */
    removeSocket(user_id: string, socket_id: string): boolean {
        const sockets = UserPresenceService.online_users.get(user_id);
        if (!sockets) return false;

        sockets.delete(socket_id);
        if (sockets.size === 0) {
            UserPresenceService.online_users.delete(user_id);
            return true; // User is now offline
        }

        UserPresenceService.online_users.set(user_id, sockets);
        return false; // User still has other connections
    }

    /**
     * Check if a user is online
     */
    isUserOnline(user_id: string): boolean {
        return UserPresenceService.online_users.has(user_id);
    }

    /**
     * Get a socket ID for a user (if online)
     */
    getSocketId(user_id: string): string | undefined {
        return UserPresenceService.online_users
            .get(user_id)
            ?.values()
            .next()
            .value;
    }

    /**
     * Check if a user is in a specific room
     */
    isUserInRoom(user_id: string, room: string, serverRooms: Map<string, Set<string>>): boolean {
        const sockets = UserPresenceService.online_users.get(user_id);
        if (!sockets) return false;

        return Array.from(sockets).some(socketId =>
            serverRooms.get(room)?.has(socketId),
        );
    }
}
