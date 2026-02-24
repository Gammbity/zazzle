import { redirect } from 'next/navigation';

/** Redirect `/products` to the home page products section. */
export default function ProductsPage() {
  redirect('/#products');
}

