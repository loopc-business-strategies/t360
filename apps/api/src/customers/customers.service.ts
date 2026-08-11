import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import type { AddressCreateInput, AddressUpdateInput, CustomerProfileUpdateInput } from "@t360/validation";

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async requireCustomer(userId: string) {
    let customer = await this.prisma.customer.findUnique({ where: { userId } });
    if (!customer) {
      customer = await this.prisma.customer.create({ data: { userId } });
    }
    return customer;
  }

  async getMe(userId: string) {
    const customer = await this.requireCustomer(userId);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { mobile: true, email: true },
    });
    return { ...customer, mobile: user?.mobile ?? null, email: user?.email ?? null };
  }

  async updateMe(userId: string, input: CustomerProfileUpdateInput) {
    const customer = await this.requireCustomer(userId);
    const updated = await this.prisma.customer.update({
      where: { id: customer.id },
      data: {
        name: input.name,
        gender: input.gender === undefined ? undefined : input.gender,
        dateOfBirth:
          input.dateOfBirth === undefined
            ? undefined
            : input.dateOfBirth
              ? new Date(input.dateOfBirth)
              : null,
      },
    });
    await this.audit.log({
      actorId: userId,
      action: "customer.profile.update",
      entityType: "Customer",
      entityId: customer.id,
    });
    return updated;
  }

  async listAddresses(userId: string) {
    const customer = await this.requireCustomer(userId);
    return this.prisma.address.findMany({
      where: { customerId: customer.id, deletedAt: null },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
  }

  async createAddress(userId: string, input: AddressCreateInput) {
    const customer = await this.requireCustomer(userId);
    const address = await this.prisma.$transaction(async (tx) => {
      if (input.isDefault) {
        await tx.address.updateMany({
          where: { customerId: customer.id, deletedAt: null },
          data: { isDefault: false },
        });
      }
      const count = await tx.address.count({
        where: { customerId: customer.id, deletedAt: null },
      });
      return tx.address.create({
        data: {
          customerId: customer.id,
          label: input.label ?? "Home",
          name: input.name,
          phone: input.phone,
          line1: input.line1,
          line2: input.line2 ?? "",
          city: input.city,
          state: input.state,
          pincode: input.pincode,
          isDefault: input.isDefault ?? count === 0,
        },
      });
    });
    await this.audit.log({
      actorId: userId,
      action: "customer.address.create",
      entityType: "Address",
      entityId: address.id,
    });
    return address;
  }

  async updateAddress(userId: string, id: string, input: AddressUpdateInput) {
    const customer = await this.requireCustomer(userId);
    const existing = await this.prisma.address.findFirst({
      where: { id, customerId: customer.id, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException({ code: "ADDRESS_NOT_FOUND", message: "Address not found" });
    }
    const updated = await this.prisma.$transaction(async (tx) => {
      if (input.isDefault) {
        await tx.address.updateMany({
          where: { customerId: customer.id, deletedAt: null },
          data: { isDefault: false },
        });
      }
      return tx.address.update({
        where: { id },
        data: {
          label: input.label,
          name: input.name,
          phone: input.phone,
          line1: input.line1,
          line2: input.line2,
          city: input.city,
          state: input.state,
          pincode: input.pincode,
          isDefault: input.isDefault,
        },
      });
    });
    await this.audit.log({
      actorId: userId,
      action: "customer.address.update",
      entityType: "Address",
      entityId: id,
    });
    return updated;
  }

  async deleteAddress(userId: string, id: string) {
    const customer = await this.requireCustomer(userId);
    const existing = await this.prisma.address.findFirst({
      where: { id, customerId: customer.id, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException({ code: "ADDRESS_NOT_FOUND", message: "Address not found" });
    }
    await this.prisma.address.update({
      where: { id },
      data: { deletedAt: new Date(), isDefault: false },
    });
    if (existing.isDefault) {
      const next = await this.prisma.address.findFirst({
        where: { customerId: customer.id, deletedAt: null },
        orderBy: { createdAt: "desc" },
      });
      if (next) {
        await this.prisma.address.update({ where: { id: next.id }, data: { isDefault: true } });
      }
    }
    await this.audit.log({
      actorId: userId,
      action: "customer.address.delete",
      entityType: "Address",
      entityId: id,
    });
    return { deleted: true };
  }

  assertOwner(customerUserId: string, actorId: string) {
    if (customerUserId !== actorId) {
      throw new ForbiddenException({ code: "FORBIDDEN", message: "Not your resource" });
    }
  }
}
