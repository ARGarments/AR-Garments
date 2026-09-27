import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import ShopByCategory from "@/components/ShopByCategory";
import NewSeasonBanner from "@/components/NewSeasonBanner";
import NewArrivals from "@/components/NewArrivals";
import CollectionBanners from "@/components/CollectionBanners";
import BestSellers from "@/components/BestSellers";
import PromotionalBanners from "@/components/PromotionalBanners";
import WhyChooseUs from "@/components/WhyChooseUs";
import Newsletter from "@/components/Newsletter";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-secondary">
      <Header />
      <Hero />
      <Features />
      <ShopByCategory />
      <NewSeasonBanner />
      <NewArrivals />
      <CollectionBanners />
      <BestSellers />
      <PromotionalBanners />
      <WhyChooseUs />
      <Newsletter />
      <Footer />
    </main>
  );
}
