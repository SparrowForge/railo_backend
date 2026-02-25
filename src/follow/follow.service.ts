import { Injectable, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Follow } from "./entities/follow.entity";

@Injectable()
export class FollowService {
    constructor(
        @InjectRepository(Follow)
        private readonly followRepo: Repository<Follow>,
    ) { }

    async followUser(
        followerId: string,
        followingId: string,
    ) {
        if (followerId === followingId) {
            throw new BadRequestException('Cannot follow yourself');
        }

        const exists = await this.followRepo.findOne({
            where: { followerId, followingId },
        });

        if (exists) return;

        await this.followRepo.save(
            this.followRepo.create({ followerId, followingId }),
        );
    }

    async unfollowUser(
        followerId: string,
        followingId: string,
    ) {
        await this.followRepo.delete({ followerId, followingId });
    }
}
