import {useParams} from 'react-router'
export function SupplierDetailPage() {
  const { id } = useParams<{ id: string }>()
  return (
    <div>
      <h1>Supplier Detail Page</h1>
      <p>Supplier ID: {id}</p>
    </div>
  )
}