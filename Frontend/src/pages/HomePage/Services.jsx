// Services.tsx - Services section with service cards
const Services = () => {
    const services = [
      { icon: Heart, title: "Cardiology Care" },
      { icon: Syringe, title: "Vaccination Services" },
      { icon: Stethoscope, title: "General Medicine" },
      { icon: Baby, title: "Pediatric Care" },
      { icon: Brain, title: "Neurology" },
      { icon: Eye, title: "Eye Care" },
      { icon: Pill, title: "Dental Services" },
      { icon: Hospital, title: "Emergency Care" },
    ];
  
    return (
      <section className="py-24 bg-gradient-to-b from-[#fdfbf7] to-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <span className="text-blue-600 font-medium mb-2 block">Our Services</span>
            <h2 className="text-3xl md:text-4xl font-serif mb-6">
              Comprehensive Healthcare Solutions
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service, index) => (
              <ServiceCard key={index} {...service} />
            ))}
          </div>
        </div>
      </section>
    );
  };

  export default Services;
  