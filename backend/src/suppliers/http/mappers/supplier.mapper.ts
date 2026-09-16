import { Supplier } from '../../domain/supplier';
import { SupplierType } from '../../domain/supplier-type';

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
  supplierTypes: SupplierType[];
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
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
    supplierTypes: supplier.getSupplierTypes(),
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

  return response;
}
