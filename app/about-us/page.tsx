import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-[#F5F1E8] flex flex-col">
      <Header />
      <div className="flex-1 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8 text-center">About Us</h1>
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <p className="text-gray-700 text-lg leading-relaxed mb-6">
                Welcome to AR Garment, your premier destination for exquisite ethnic wear. We specialize in bringing you the finest collection of sarees, suits, dupatta sets, and fashion for men and kids.
              </p>
              <p className="text-gray-700 text-lg leading-relaxed mb-6">
                Our journey began with a passion for traditional craftsmanship and a commitment to quality. Every piece in our collection is carefully curated to ensure you receive nothing but the best.
              </p>
              <p className="text-gray-700 text-lg leading-relaxed">
                We believe that fashion is not just about clothing; it's about expressing your unique identity. Our team works tirelessly to bring you designs that blend tradition with contemporary style.
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
