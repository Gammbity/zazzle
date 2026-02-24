interface OrderDetailPageProps {
  params: { id: string };
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = params;

  return (
    <main className='mx-auto max-w-4xl px-4 py-8'>
      <h1 className='text-2xl font-semibold'>Order {id}</h1>
      {/* TODO: fetch order details from /api/orders/{id} */}
    </main>
  );
}

