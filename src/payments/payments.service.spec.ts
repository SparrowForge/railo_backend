import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ObjectLiteral, Repository } from 'typeorm';
import { SubscriptionPackage } from '../subscription-package/entities/subscription-package.entity';
import { User } from '../users/entities/user.entity';
import { SubscriptionPayment } from './entities/subscription-payment.entity';
import { UserSubscription } from './entities/user-subscription.entity';
import { SubscriptionPaymentStatus } from './enums/subscription-payment-status.enum';
import { MyFatoorahService } from './myfatoorah.service';
import { PaymentsService } from './payments.service';

type MockRepo<T extends ObjectLiteral> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

const createRepositoryMock = <T extends ObjectLiteral>(): MockRepo<T> => ({
  create: jest.fn((input) => input),
  save: jest.fn(async (input) => input),
  findOne: jest.fn(),
  update: jest.fn(),
  createQueryBuilder: jest.fn(),
});

describe('PaymentsService', () => {
  let service: PaymentsService;
  let paymentRepo: MockRepo<SubscriptionPayment>;
  let subscriptionRepo: MockRepo<UserSubscription>;
  let packageRepo: MockRepo<SubscriptionPackage>;
  let userRepo: MockRepo<User>;
  let myFatoorahService: {
    getCurrency: jest.Mock;
    initiatePayment: jest.Mock;
    executePayment: jest.Mock;
    getPaymentStatus: jest.Mock;
    getDefaultPaymentMethodId: jest.Mock;
    verifyWebhookSignature: jest.Mock;
  };

  beforeEach(async () => {
    paymentRepo = createRepositoryMock<SubscriptionPayment>();
    subscriptionRepo = createRepositoryMock<UserSubscription>();
    packageRepo = createRepositoryMock<SubscriptionPackage>();
    userRepo = createRepositoryMock<User>();
    myFatoorahService = {
      getCurrency: jest.fn().mockReturnValue('KWD'),
      initiatePayment: jest.fn(),
      executePayment: jest.fn(),
      getPaymentStatus: jest.fn(),
      getDefaultPaymentMethodId: jest.fn(),
      verifyWebhookSignature: jest.fn().mockReturnValue(true),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: getRepositoryToken(SubscriptionPayment),
          useValue: paymentRepo,
        },
        {
          provide: getRepositoryToken(UserSubscription),
          useValue: subscriptionRepo,
        },
        {
          provide: getRepositoryToken(SubscriptionPackage),
          useValue: packageRepo,
        },
        {
          provide: getRepositoryToken(User),
          useValue: userRepo,
        },
        {
          provide: MyFatoorahService,
          useValue: myFatoorahService,
        },
      ],
    }).compile();

    service = moduleRef.get(PaymentsService);
  });

  it('initiates payment with active package amount from backend', async () => {
    (userRepo.findOne as jest.Mock).mockResolvedValue({
      id: 'user-1',
      name: 'User',
      display_name: 'Display User',
      email: 'user@example.com',
      phone_no: '+96512345678',
    });
    (packageRepo.findOne as jest.Mock).mockResolvedValue({
      id: 'package-1',
      price: 10,
      discountPrice: 7,
      duration: 30,
      isActive: true,
      benifits: [],
    });
    (paymentRepo.save as jest.Mock)
      .mockResolvedValueOnce({
        id: 'payment-1',
        user_id: 'user-1',
        subscription_package_id: 'package-1',
        amount: 7,
        currency: 'KWD',
        status: SubscriptionPaymentStatus.created,
      })
      .mockResolvedValueOnce({
        id: 'payment-1',
        user_id: 'user-1',
        subscription_package_id: 'package-1',
        amount: 7,
        currency: 'KWD',
        status: SubscriptionPaymentStatus.initiated,
        myfatoorah_invoice_id: '1001',
      });
    myFatoorahService.initiatePayment.mockResolvedValue({
      Data: { PaymentMethods: [{ PaymentMethodId: 2, PaymentMethodEn: 'VISA' }] },
    });
    myFatoorahService.executePayment.mockResolvedValue({
      Data: { InvoiceId: 1001, PaymentURL: 'https://pay.test/1001' },
    });

    const result = await service.initiateSubscriptionPayment(
      'user-1',
      'package-1',
      {},
    );

    expect(myFatoorahService.initiatePayment).toHaveBeenCalledWith(7, 'KWD');
    expect(myFatoorahService.executePayment).toHaveBeenCalledWith(
      expect.objectContaining({
        invoiceValue: 7,
        paymentMethodId: 2,
        customerReference: 'payment-1',
      }),
    );
    expect(result.amount).toBe(7);
    expect(result.myfatoorah.paymentUrl).toBe('https://pay.test/1001');
  });

  it('rejects inactive package', async () => {
    (userRepo.findOne as jest.Mock).mockResolvedValue({ id: 'user-1' });
    (packageRepo.findOne as jest.Mock).mockResolvedValue({
      id: 'package-1',
      isActive: false,
    });

    await expect(
      service.initiateSubscriptionPayment('user-1', 'package-1', {}),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('forbids reading another user payment', async () => {
    (paymentRepo.findOne as jest.Mock).mockResolvedValue({
      id: 'payment-1',
      user_id: 'user-2',
      status: SubscriptionPaymentStatus.initiated,
    });

    await expect(
      service.getPaymentStatus('payment-1', 'user-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('recheck marks successful payment as paid and creates subscription', async () => {
    (paymentRepo.findOne as jest.Mock).mockResolvedValue({
      id: 'payment-1',
      user_id: 'user-1',
      subscription_package_id: 'package-1',
      status: SubscriptionPaymentStatus.initiated,
      myfatoorah_invoice_id: '1001',
      gateway_response: null,
    });
    myFatoorahService.getPaymentStatus.mockResolvedValue({
      Data: { InvoiceStatus: 'Paid', InvoiceReference: 'INV-1001' },
    });
    (subscriptionRepo.findOne as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'sub-1', status: 'active' });
    (packageRepo.findOne as jest.Mock).mockResolvedValue({
      id: 'package-1',
      duration: 30,
    });

    const queryBuilder = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ affected: 0 }),
    };
    subscriptionRepo.createQueryBuilder = jest.fn().mockReturnValue(queryBuilder);

    await service.recheckPayment('payment-1', 'user-1');

    expect(subscriptionRepo.save).toHaveBeenCalled();
    expect(userRepo.update).toHaveBeenCalledWith('user-1', {
      isSubscribedUser: true,
    });
    expect(paymentRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: SubscriptionPaymentStatus.paid,
      }),
    );
  });
});
