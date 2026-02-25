import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EmailService } from 'src/auth/email.service';
import { NotificationService } from 'src/notifications/notifications.service';
import { UsersService } from 'src/users/users.service';
import { Repository } from 'typeorm';

import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { NotificationSummaryDto } from './data/summary.dto';
import { CreateNotificationRecordDto } from './dto/create-notification-record.dto';
import { FilterNotificationRecordDto } from './dto/filter-notification-record.dto';
import { UpdateNotificationRecordDto } from './dto/update-notification-record.dto';
import { NotificationRecord } from './entities/notification-record.entity';

@Injectable()
export class NotificationRecordService {
  constructor(
    @InjectRepository(NotificationRecord)
    private notificationRecordRepository: Repository<NotificationRecord>,
    private emailService: EmailService,
    private userService: UsersService,
    private pushNotificationService: NotificationService,
  ) { }

  async summary(): Promise<NotificationSummaryDto> {
    const sql = `
    select
	sum(sent_today) as sent_today,
	sum(push_notification) as push_notification,
	sum(email) as email,
	sum(total_recipients) as total_recipients
from
	(
	select
		count(id) as sent_today,
		0 as push_notification,
		0 as email,
		0 as total_recipients
	from
		public.notification_records
	where
		DATE("createdAt") = CURRENT_DATE
union all
	select
		0 as sent_today,
		count(id) as push_notification,
		0 as email,
		0 as total_recipients
	from
		public.notification_records
	where
		"notificationType" = 'Push Notifications'
union all
	select
		0 as sent_today,
		0 as push_notification,
		count(id) as email,
		0 as total_recipients
	from
		public.notification_records
	where
		"notificationType" = 'Email'
union all
	select
		0 as sent_today,
		count(id) as push_notification,
		count(id) as email,
		0 as total_recipients
	from
		public.notification_records
	where
		"notificationType" = 'Both'
union all
	select
		0 as sent_today,
		0 as push_notification,
		0 as email,
		count(user_id) as total_recipients
	from
		(
		select
			distinct user_id
		from
			public.notification_records nr
		left join(
		select
			id user_id,
			'All Users' recipient_type
		from
			users u
		union all
		select
			id user_id,
			'Active Users' recipient_type
		from
			users u
		where
			u.status = 'active'
		union all
		select
			id user_id,
			'Inactive Users' recipient_type
		from
			users u
		where
			u.status = 'inactive'
		union all
		
		select
			tmain.user_id user_id,
			tmain.recipient_type as recipient_type
		from
			(
				select (u.id) user_id, r."name" recipient_type from users u 
				left join roles r on u."roleId" = r.id 
			) as tmain
		) trecipients
	on
			nr."recipientType" = trecipients.recipient_type) tusers
)tmain
    `;

    const data =
      await this.notificationRecordRepository.query<NotificationSummaryDto[]>(
        sql,
      );
    const res = {} as NotificationSummaryDto;
    if (data && data.length > 0) {
      res.sent_today = Number(data[0].sent_today);
      res.push_notification = Number(data[0].push_notification);
      res.email = Number(data[0].email);
      res.total_recipients = Number(data[0].total_recipients);
    }
    return res;
  }

  async unseenNotificationCount(userId: number) {
    return await this.notificationRecordRepository.count({
      where: { userId: userId, isSeen: false },
    });
  }

  async createAndSendNotification(dto: CreateNotificationRecordDto) {
    const notificationRecord = this.notificationRecordRepository.create(dto);
    const res =
      await this.notificationRecordRepository.save(notificationRecord);
    console.log('sending noti');

    // await this.sendNotificationsByRecipientTypeAsync({
    //   recipientType: dto.recipientType,
    //   notificationTitle: dto.notificationTitle,
    //   notificationMessage: dto.notificationMessage,
    //   notificationType: dto.notificationType,
    // });
    return res;
  }

  async onlyCreateRecord(dto: CreateNotificationRecordDto) {
    const notificationRecord = this.notificationRecordRepository.create(dto);
    const res =
      await this.notificationRecordRepository.save(notificationRecord);
    return res;
  }

  async findAll(
    paginationDto: PaginationDto,
    filters?: Partial<FilterNotificationRecordDto>
  ): Promise<PaginatedResponseDto<NotificationRecord>> {
    const { page = 1, limit = 1000000000000 } = paginationDto;
    const skip = (page - 1) * limit;

    const qb = this.notificationRecordRepository
      .createQueryBuilder('notificationRecord')
      .leftJoinAndSelect('notificationRecord.users', 'users')
      .skip(skip)
      .take(limit)
      .orderBy('notificationRecord.createdAt', 'DESC')
      .where('notificationRecord.deletedAt IS NULL');
    if (filters?.userId) {
      qb.andWhere('notificationRecord.userId = :userId', {
        userId: filters.userId,
      });
    }
    if (filters?.isSeen) {
      qb.andWhere('notificationRecord.isSeen = :isSeen', {
        isSeen: filters.isSeen,
      });
    }

    const [items, total] = await qb.getManyAndCount();

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      items,
      meta: { total, page, limit, totalPages, hasNextPage, hasPreviousPage },
    };
  }

  findOne(id: number) {
    return this.notificationRecordRepository.findOne({
      where: { id },
      withDeleted: false,
    });
  }

  async update(id: number, dto: UpdateNotificationRecordDto) {
    const res = this.notificationRecordRepository.update(id, dto);
    //========================================================
    // await this.sendNotificationsByRecipientTypeAsync({
    //   recipientType: dto.recipientType,
    //   notificationTitle: dto.notificationTitle,
    //   notificationMessage: dto.notificationMessage,
    //   notificationType: dto.notificationType,
    // });
    return res;
  }

  async seen(id: number) {
    const res = this.notificationRecordRepository.update(id, {
      isSeen: true,
    });

    return res;
  }

  async unseen(id: number) {
    const res = this.notificationRecordRepository.update(id, {
      isSeen: false,
    });

    return res;
  }


  remove(id: number) {
    return this.notificationRecordRepository.softDelete(id);
  }

  restore(id: number) {
    return this.notificationRecordRepository.restore(id);
  }

  permanentRemove(id: number) {
    return this.notificationRecordRepository.delete(id);
  }

  deleteByUserId(userId: number) {
    return this.notificationRecordRepository.delete({
      userId: userId,
    });
  }

}
