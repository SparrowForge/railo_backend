/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient, RedisClientType } from 'redis';
import { ServerOptions } from 'socket.io';

export class SocketIoRedisAdapter extends IoAdapter {
    private adapterConstructor: ReturnType<typeof createAdapter> | null = null;
    private pubClient: RedisClientType | null = null;
    private subClient: RedisClientType | null = null;

    constructor(app: INestApplicationContext) {
        super(app);
    }

    async connectToRedis(redisUrl: string): Promise<void> {
        this.pubClient = createClient({
            url: redisUrl,
            socket: {
                reconnectStrategy: (retries) => Math.min(retries * 100, 3000),
            },
        });

        this.subClient = this.pubClient.duplicate();

        this.pubClient.on('error', (err) => {
            console.error('Redis pubClient error', err);
        });

        this.subClient.on('error', (err) => {
            console.error('Redis subClient error', err);
        });

        await this.pubClient.connect();
        await this.subClient.connect();

        this.adapterConstructor = createAdapter(this.pubClient, this.subClient);
    }

    createIOServer(port: number, options?: ServerOptions) {
        const server = super.createIOServer(port, {
            ...options,
            cors: {
                origin: '*',
                credentials: true,
                ...(options?.cors ?? {}),
            },
        });

        if (!this.adapterConstructor) {
            throw new Error('Redis adapter is not initialized. Call connectToRedis() first.');
        }

        server.adapter(this.adapterConstructor);

        return server;
    }

    async closeRedisConnections(): Promise<void> {
        try {
            if (this.pubClient?.isOpen) {
                await this.pubClient.quit();
            }
            if (this.subClient?.isOpen) {
                await this.subClient.quit();
            }
        } catch (error) {
            console.error('Failed to close Redis connections', error);
        }
    }
}