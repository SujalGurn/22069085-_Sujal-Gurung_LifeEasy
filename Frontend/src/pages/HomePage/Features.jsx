// Features.tsx - Features section with cards
const Features = () => {
    const features = [
      {
        icon: Check,
        title: "Expert Care",
        description: "Our doctors are dedicated to providing expert care and personalized treatment plans for every patient."
      },
      {
        icon: Calendar,
        title: "Easy Scheduling",
        description: "Book appointments easily online or through our mobile app - within 7 days of scheduling."
      },
      {
        icon: Phone,
        title: "24/7 Support",
        description: "Our dedicated support team is available around the clock to assist you with any concerns."
      },
      {
        icon: Clock,
        title: "Quick Response",
        description: "Get timely responses and treatment plans from our experienced medical professionals."
      }
    ];
  
    return (
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <span className="text-blue-600 font-medium mb-2 block">Our Features</span>
            <h2 className="text-3xl md:text-4xl font-serif mb-6">
              Caring for your health is our top concern
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
        </div>
      </section>
    );
  };

  export default Features;
  