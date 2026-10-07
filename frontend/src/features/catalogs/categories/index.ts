export { CategoriesPage } from './pages/CategoriesPage'
export { CategoryFormModal } from './components/CategoryFormModal'
export { useCategories } from './api/categories.queries'
// Para quien necesite leer la lista de rubros compartiendo la misma caché
// (el selector de rubro de Fábricas).
export { categoryKeys } from './api/categories.keys'
export { listCategories } from './api/categories.api'

export type { Category, CategoryInput } from './types/category'
