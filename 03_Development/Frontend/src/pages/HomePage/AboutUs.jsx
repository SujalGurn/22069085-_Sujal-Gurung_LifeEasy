// AboutUs.tsx - About section with image and description
const AboutUs = () => {
    return (
      <section className="py-24 bg-[#fdfbf7]">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1649972904349-6e44c42644a7" 
                alt="Doctor with stethoscope" 
                className="rounded-2xl shadow-xl"
              />
            </div>
            <div className="space-y-8">
              <div>
                <span className="text-blue-600 font-medium mb-2 block">About Us</span>
                <h2 className="text-3xl md:text-4xl font-serif mb-2">Who we are</h2>
              </div>
              <Card className="p-8 bg-white/50 backdrop-blur">
                <p className="text-gray-700 leading-relaxed mb-6">
                  We are a trusted healthcare provider, dedicated to delivering high-quality care through our advanced medical facilities and technologies.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  We focus on prevention, proper care, and patient education to ensure the well-being of our patients and help them maintain a healthy life.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>
    );
  };

  export default AboutUs;
  