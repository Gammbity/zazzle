export default function HomePage() {
  return (
    <div className='min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50'>
      <div className='container mx-auto px-4 py-16'>
        {/* Hero Section */}
        <div className='text-center mb-16'>
          <h1 className='text-5xl md:text-7xl font-bold gradient-text mb-6'>
            Zazzle Uzbekistan
          </h1>
          <p className='text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto'>
            Create custom designs and print them on high-quality products. 
            T-shirts, mugs, posters and more. Made in Uzbekistan.
          </p>
          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <button className='btn-primary px-8 py-4 text-lg'>
              Start Creating
            </button>
            <button className='btn-outline px-8 py-4 text-lg'>
              Browse Products
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className='grid md:grid-cols-3 gap-8 mb-16'>
          <div className='card p-8 text-center'>
            <div className='w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              <svg className='w-8 h-8 text-primary-600' fill='currentColor' viewBox='0 0 20 20'>
                <path d='M4 3a2 2 0 100 4h12a2 2 0 100-4H4z' />
                <path fillRule='evenodd' d='M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z' clipRule='evenodd' />
              </svg>
            </div>
            <h3 className='text-xl font-semibold mb-2'>Custom Designs</h3>
            <p className='text-gray-600'>Upload your own designs or choose from our library of templates</p>
          </div>

          <div className='card p-8 text-center'>
            <div className='w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              <svg className='w-8 h-8 text-primary-600' fill='currentColor' viewBox='0 0 20 20'>
                <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
              </svg>
            </div>
            <h3 className='text-xl font-semibold mb-2'>High Quality</h3>
            <p className='text-gray-600'>Premium materials and professional printing technology</p>
          </div>

          <div className='card p-8 text-center'>
            <div className='w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              <svg className='w-8 h-8 text-primary-600' fill='currentColor' viewBox='0 0 20 20'>
                <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z' clipRule='evenodd' />
              </svg>
            </div>
            <h3 className='text-xl font-semibold mb-2'>Fast Delivery</h3>
            <p className='text-gray-600'>Quick processing and delivery throughout Uzbekistan</p>
          </div>
        </div>

        {/* CTA Section */}
        <div className='card p-12 text-center bg-gradient-to-r from-primary-600 to-secondary-600 text-white'>
          <h2 className='text-3xl font-bold mb-4'>Ready to Get Started?</h2>
          <p className='text-xl mb-6 opacity-90'>
            Join thousands of customers creating amazing custom products
          </p>
          <button className='btn bg-white text-primary-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold'>
            Create Your First Design
          </button>
        </div>
      </div>
    </div>
  );
}