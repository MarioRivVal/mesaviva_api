export class DomainErrors extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}
export class NotFoundError extends DomainErrors {
  constructor(resource: string, id?: string) {
    super(id ? `${resource} with id ${id} not found` : `${resource} not found`);
  }
}
export class ConflictError extends DomainErrors {}
export class BadRequestError extends DomainErrors {}
export class UnauthorizedError extends DomainErrors {}
export class ForbiddenError extends DomainErrors {}
