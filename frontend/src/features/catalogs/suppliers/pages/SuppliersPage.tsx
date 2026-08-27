import { useSuppliers } from "../api/useSuppliers"
export function SuppliersPage() {
  const {data, isPending, error} = useSuppliers()
  console.log({data, isPending, error})
  return (
    <div>
      <h1>Suppliers Page</h1>
    </div>
  )
}