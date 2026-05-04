import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import About from "@/components/About";
import FeaturesGrid from "@/components/FeaturesGrid";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { organizationSchema } from "@/utils/structuredData";

const Index = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, [location]);

  return (
    <>
      <SEOHead
        title="Premium Acoustic Solutions for Every Space"
        description="Transform your space with professional acoustic ceilings and wall absorbers. Expert acoustic solutions for offices, hospitality, residential and entertainment spaces. 25+ years experience, 500+ projects completed."
        keywords="acoustic panels, sound absorption, acoustic ceiling tiles, wall absorbers, soundproofing, acoustic treatment, noise reduction"
        canonical="https://yoursite.com/"
        structuredData={organizationSchema}
      />
      <div className="min-h-screen">
        <Navigation />
        <Hero />
        <div id="about">
          <About />
        </div>
        <FeaturesGrid />
        <div id="contact">
          <Contact />
        </div>
        <Footer />
      </div>
    </>
  );
};

export default Index;
