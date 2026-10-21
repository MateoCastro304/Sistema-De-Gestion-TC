import { Supplier } from '../../../core/domain/entities/supplier';
import { SupplierType } from '../../../core/domain/value-objects/supplier-type';

/**
 * Response shape returned by every HTTP endpoint that yields a supplier.
 * Mirrors the Supplier schema in the OpenAPI spec: required fields at the
 * top level and optional fields (cuit, contact*, address) are omitted when
 * absent instead of being serialized as null, following the schema's
 * non-nullable declaration.
 */
export type SupplierResponse = {
  id: number;
  legalName: string;
  cuit?: string;
  supplierType: SupplierType;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  observation?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

/**
 * Envelope returned by GET /suppliers. Same shape as /factories and
 * /customers: the page of items plus the total matching the filters, so the
 * client can render a pager without a second round-trip. page and limit are
 * echoed back because they are defaulted server-side.
 */
export type SupplierListResponse = {
  items: SupplierResponse[];
  total: number;
  page: number;
  limit: number;
};

/**
 * Serializes a persisted Supplier aggregate into its HTTP response form.
 * Lives in the http layer on purpose: the domain must not learn about JSON,
 * ISO date strings, or the CUIT display format with dashes.
 */
export function toSupplierResponse(supplier: Supplier): SupplierResponse {
  const response: SupplierResponse = {
    id: supplier.getId()!,
    legalName: supplier.getLegalName(),
    supplierType: supplier.getSupplierType(),
    active: supplier.getActive(),
    createdAt: supplier.getCreatedAt().toISOString(),
    updatedAt: supplier.getUpdatedAt().toISOString(),
  };

  const cuit = supplier.getCuit();
  if (cuit !== null) response.cuit = cuit.getFormatted();

  const contactName = supplier.getContactName();
  if (contactName !== null) response.contactName = contactName;

  const contactEmail = supplier.getContactEmail();
  if (contactEmail !== null) response.contactEmail = contactEmail.getValue();

  const contactPhone = supplier.getContactPhone();
  if (contactPhone !== null) response.contactPhone = contactPhone.getValue();

  const address = supplier.getAddress();
  if (address !== null) response.address = address;

  const observation = supplier.getObservation();
  if (observation !== null) response.observation = observation;

  return response;
}
